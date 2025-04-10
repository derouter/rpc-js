import * as cbor from "cbor2";
import Emittery from "emittery";
import net from "node:net";
import { Duplex } from "node:stream";
import * as v from "valibot";
import yamux from "yamux-js";
import { InboundFrameSchema } from "./rpc/inbound.js";
import type {
  JobRecord,
  OfferRemoved,
  OfferSnapshot,
  ProviderHeartbeat,
  ProviderRecord,
} from "./rpc/inbound/dto.js";
import type { ProviderCreateJobData } from "./rpc/inbound/request/provider/create_job.js";
import type { ProviderOpenJobConnectionData } from "./rpc/inbound/request/provider/open_job_connection.js";
import type { ProviderPrepareJobConnectionData } from "./rpc/inbound/request/provider/prepare_job_connection.js";
import type { InboundResponseFrame } from "./rpc/inbound/response.js";
import { ConsumerCompleteJobError } from "./rpc/inbound/response/consumer/complete_job.js";
import { ConsumerCreateJobError } from "./rpc/inbound/response/consumer/create_job.js";
import { ConsumerGetJobError } from "./rpc/inbound/response/consumer/get_job.js";
import { ConsumerOpenJobConnectionError } from "./rpc/inbound/response/consumer/open_job_connection.js";
import { FailJobError } from "./rpc/inbound/response/fail_job.js";
import { ProviderCompleteJobError } from "./rpc/inbound/response/provider/complete_job.js";
import { ProviderProvideError } from "./rpc/inbound/response/provider/provide.js";
import { QueryActiveOffersError } from "./rpc/inbound/response/query/active_offers.js";
import { QueryJobsError } from "./rpc/inbound/response/query/jobs.js";
import { QueryOfferSnapshotsError } from "./rpc/inbound/response/query/offer_snapshots.js";
import { QueryProvidersError } from "./rpc/inbound/response/query/providers.js";
import { SubscribeToActiveOffersError } from "./rpc/inbound/response/subscription/active_offers.js";
import { CancelSubscriptionError } from "./rpc/inbound/response/subscription/cancel.js";
import { SubscribeToJobsError } from "./rpc/inbound/response/subscription/jobs.js";
import type { OutboundRequestFrame } from "./rpc/outbound/request.js";
import {
  ConsumerCompleteJobDataSchema,
  type ConsumerCompleteJobData,
} from "./rpc/outbound/request/consumer/complete_job.js";
import {
  ConsumerCreateJobDataSchema,
  type ConsumerCreateJobData,
} from "./rpc/outbound/request/consumer/create_job.js";
import {
  ConsumerGetJobDataSchema,
  type ConsumerGetJobData,
} from "./rpc/outbound/request/consumer/get_job.js";
import {
  ConsumerOpenJobConnectionDataSchema,
  type ConsumerOpenJobConnectionData,
} from "./rpc/outbound/request/consumer/open_job_connection.js";
import {
  FailJobDataDataSchema,
  type FailJobData,
} from "./rpc/outbound/request/fail_job.js";
import {
  ProviderCompleteJobDataSchema,
  type ProviderCompleteJobData,
} from "./rpc/outbound/request/provider/complete_job.js";
import {
  ProviderProvideDataSchema,
  type ProviderProvideData,
} from "./rpc/outbound/request/provider/provide.js";
import {
  QueryActiveOffersRequestDataSchema,
  type QueryActiveOffersRequestData,
} from "./rpc/outbound/request/query/active_offers.js";
import {
  QueryJobsRequestDataSchema,
  type QueryJobsRequestData,
} from "./rpc/outbound/request/query/jobs.js";
import {
  QueryOfferSnapshotsRequestDataSchema,
  type QueryOfferSnapshotsRequestData,
} from "./rpc/outbound/request/query/offer_snapshots.js";
import {
  QueryProvidersRequestDataSchema,
  type QueryProvidersRequestData,
} from "./rpc/outbound/request/query/providers.js";
import {
  SubscribeToActiveOffersRequestDataSchema,
  type SubscribeToActiveOffersRequestData,
} from "./rpc/outbound/request/subscription/active_offers.js";
import {
  SubscribeToJobsRequestDataSchema,
  type SubscribeToJobsRequestData,
} from "./rpc/outbound/request/subscription/jobs.js";
import type { OutboundResponseFrame } from "./rpc/outbound/response.js";
import type { ProviderCreateJobResponseData } from "./rpc/outbound/response/provider/create_job.js";
import type { ProviderPrepareJobConnectionResponseData } from "./rpc/outbound/response/provider/prepare_job_connection.js";
import { Deferred, Mutex, unreachable, writeAll, writeCbor } from "./util.js";

export {
  ConsumerCompleteJobError,
  ConsumerCreateJobError,
  ConsumerGetJobError,
  ConsumerOpenJobConnectionError,
  ProviderCompleteJobError,
  type JobRecord,
  type OfferRemoved,
  type OfferSnapshot,
  type ProviderCreateJobData,
  type ProviderCreateJobResponseData,
  type ProviderHeartbeat,
  type ProviderPrepareJobConnectionData,
  type ProviderPrepareJobConnectionResponseData,
  type ProviderRecord,
};

export class RPC {
  private _yamuxClient;
  private _rpcStream;
  private _socket;
  private _outboundRequestCounter = 0;
  private _rpcWriteMutex = new Mutex();

  readonly emitter = new Emittery<{
    offerRemoved: OfferRemoved;
    offerUpdated: OfferSnapshot;
    providerHeartbeat: ProviderHeartbeat;
    providerUpdated: ProviderRecord;
    jobUpdated: JobRecord;
    providerOpenJobConnection: ProviderOpenJobConnectionData & {
      stream: Duplex;
    };
  }>();

  private readonly _pendingOutboundRequests = new Map<
    number,
    Deferred<InboundResponseFrame>
  >();

  private _onProviderCreateJob?: (
    data: ProviderCreateJobData
  ) => Promise<ProviderCreateJobResponseData>;

  private _onProviderPrepareJobConnection?: (
    data: ProviderPrepareJobConnectionData
  ) => Promise<ProviderPrepareJobConnectionResponseData>;

  constructor(rpcHost: string, rpcPort: number) {
    this._socket = new net.Socket().connect(rpcPort, rpcHost);
    this._yamuxClient = new yamux.Client({ enableKeepAlive: true });

    this._socket.pipe(this._yamuxClient);
    this._yamuxClient.pipe(this._socket);

    // The first stream is the RPC stream.
    this._rpcStream = this._yamuxClient.open();

    this._rpcLoop();
  }

  //#region Common methods
  //

  /**
   * @throws {FailJobError}
   */
  async failJob(data: FailJobData): Promise<void> {
    const parsedData = v.parse(FailJobDataDataSchema, data);

    const response = await this._rpcRequest(
      { type: "FailJob", data: parsedData },
      "FailJob"
    );

    if (response.type !== "FailJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new FailJobError(response.data);
    }
  }

  //
  //#endregion

  //#region Consumer methods
  //

  /**
   * Request Provider to create a new job.
   * @throws {ConsumerCreateJobError}
   */
  async consumerCreateJob(data: ConsumerCreateJobData): Promise<{
    provider_peer_id: string;
    provider_job_id: string;
  }> {
    const parsedData = v.parse(ConsumerCreateJobDataSchema, data);

    const response = await this._rpcRequest(
      { type: "ConsumerCreateJob", data: parsedData },
      "ConsumerCreateJob"
    );

    if (response.type !== "ConsumerCreateJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerCreateJobError(response.data);
    }

    return response.data.content;
  }

  /**
   * Request to open a new persistent job connection.
   * @throws {ConsumerOpenJobConnectionError}.
   */
  async consumerOpenJobConnection(
    data: ConsumerOpenJobConnectionData
  ): Promise<{ stream: Duplex; connectionId: number }> {
    const parsedData = v.parse(ConsumerOpenJobConnectionDataSchema, data);

    const response = await this._rpcRequest(
      { type: "ConsumerOpenJobConnection", data: parsedData },
      "ConsumerOpenJobConnection"
    );

    if (response.type !== "ConsumerOpenJobConnection") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerOpenJobConnectionError(response.data);
    }

    const stream = this._yamuxClient.open();
    const connectionId = response.data.content.connection_id;

    // We're writing the connection ID into the yamux stream.
    const buffer = Buffer.allocUnsafe(8);
    buffer.writeBigInt64BE(BigInt(connectionId));
    await writeAll(stream, buffer);

    return { stream, connectionId };
  }

  /**
   * @throws {ConsumerGetJobError}
   */
  async consumerGetJob(data: ConsumerGetJobData): Promise<{
    public_payload?: string | null;
    balance_delta?: string | null;
    created_at_sync: number;
    completed_at_sync?: number | null;
  }> {
    const parsedData = v.parse(ConsumerGetJobDataSchema, data);

    const response = await this._rpcRequest(
      { type: "ConsumerGetJob", data: parsedData },
      "ConsumerGetJob"
    );

    if (response.type !== "ConsumerGetJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerGetJobError(response.data);
    }

    return response.data.content;
  }

  /**
   * Mark a job as completed. This will sign the job on the backend
   * and queue sending the signature to the Provider.
   *
   * @throws {ConsumerCompleteJobError}
   */
  async consumerCompleteJob(data: ConsumerCompleteJobData): Promise<void> {
    const parsedData = v.parse(ConsumerCompleteJobDataSchema, data);

    const response = await this._rpcRequest(
      { type: "ConsumerCompleteJob", data: parsedData },
      "ConsumerCompleteJob"
    );

    if (response.type !== "ConsumerCompleteJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerCompleteJobError(response.data);
    }
  }

  //
  //#endregion

  //#region Provider methods
  //

  /**
   * Set callback when the module is requested to create a job.
   */
  setOnProviderCreateJob(
    cb: (data: ProviderCreateJobData) => Promise<ProviderCreateJobResponseData>
  ) {
    this._onProviderCreateJob = cb;
  }

  /**
   * Set callback when the module is asked for a new job connection.
   * Once it verifies, the `"providerOpenJobConnection"` is emitted.
   */
  setOnProviderPrepareJobConnection(
    cb: (
      data: ProviderPrepareJobConnectionData
    ) => Promise<ProviderPrepareJobConnectionResponseData>
  ) {
    this._onProviderPrepareJobConnection = cb;
  }

  /**
   * Mark a job as completed, locally.
   * @throws {ProviderCompleteJobError}
   */
  async providerCompleteJob(data: ProviderCompleteJobData): Promise<{
    completed_at_sync: number;
  }> {
    const parsedData = v.parse(ProviderCompleteJobDataSchema, data);

    const response = await this._rpcRequest(
      { type: "ProviderCompleteJob", data: parsedData },
      "ProviderCompleteJob"
    );

    if (response.type !== "ProviderCompleteJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ProviderCompleteJobError(response.data);
    }

    return {
      completed_at_sync: response.data.content.completed_at_sync,
    };
  }

  /**
   * Start providing offers.
   * @throws {ProviderProvideError}
   */
  async providerProvideOffer(data: ProviderProvideData): Promise<void> {
    const parsedData = v.parse(ProviderProvideDataSchema, data);

    const response = await this._rpcRequest(
      { type: "ProviderProvide", data: parsedData },
      "ProviderProvide"
    );

    if (response.type !== "ProviderProvide") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ProviderProvideError(response.data);
    }
  }

  //
  //#endregion

  //#region Queries
  //

  async queryActiveOffers(
    data: QueryActiveOffersRequestData
  ): Promise<OfferSnapshot[]> {
    const parsedData = v.parse(QueryActiveOffersRequestDataSchema, data);

    const response = await this._rpcRequest(
      { type: "QueryActiveOffers", data: parsedData },
      "QueryActiveOffers"
    );

    if (response.type !== "QueryActiveOffers") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new QueryActiveOffersError(response.data);
    }

    return response.data.content;
  }

  async queryActiveProviders(): Promise<string[]> {
    const response = await this._rpcRequest(
      { type: "QueryActiveProviders", data: {} },
      "QueryActiveProviders"
    );

    if (response.type !== "QueryActiveProviders") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    return response.data.content;
  }

  async queryJobs(data: QueryJobsRequestData): Promise<JobRecord[]> {
    const parsedData = v.parse(QueryJobsRequestDataSchema, data);

    const response = await this._rpcRequest(
      { type: "QueryJobs", data: parsedData },
      "QueryJobs"
    );

    if (response.type !== "QueryJobs") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new QueryJobsError(response.data);
    }

    return response.data.content;
  }

  async queryOfferSnapshots(
    data: QueryOfferSnapshotsRequestData
  ): Promise<OfferSnapshot[]> {
    const parsedData = v.parse(QueryOfferSnapshotsRequestDataSchema, data);

    const response = await this._rpcRequest(
      { type: "QueryOfferSnapshots", data: parsedData },
      "QueryOfferSnapshots"
    );

    if (response.type !== "QueryOfferSnapshots") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new QueryOfferSnapshotsError(response.data);
    }

    return response.data.content;
  }

  async queryProviders(
    data: QueryProvidersRequestData
  ): Promise<ProviderRecord[]> {
    const parsedData = v.parse(QueryProvidersRequestDataSchema, data);

    const response = await this._rpcRequest(
      { type: "QueryProviders", data: parsedData },
      "QueryProviders"
    );

    if (response.type !== "QueryProviders") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new QueryProvidersError(response.data);
    }

    return response.data.content;
  }

  async querySystem(): Promise<{ peer_id: string }> {
    const response = await this._rpcRequest(
      { type: "QuerySystem", data: {} },
      "QuerySystem"
    );

    if (response.type !== "QuerySystem") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    return response.data.content;
  }

  //
  //#endregion

  //#region Subscriptions
  //

  async cancelSubscription(subscription_id: number): Promise<void> {
    const response = await this._rpcRequest(
      { type: "CancelSubscription", data: { subscription_id } },
      "CancelSubscription"
    );

    if (response.type !== "CancelSubscription") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new CancelSubscriptionError(response.data);
    }
  }

  async subscribeToActiveOffers(
    data: SubscribeToActiveOffersRequestData
  ): Promise<number> {
    const parsedData = v.parse(SubscribeToActiveOffersRequestDataSchema, data);

    const response = await this._rpcRequest(
      { type: "SubscribeToActiveOffers", data: parsedData },
      "SubscribeToActiveOffers"
    );

    if (response.type !== "SubscribeToActiveOffers") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new SubscribeToActiveOffersError(response.data);
    }

    return response.data.content;
  }

  async subscribeToActiveProviders(): Promise<number> {
    const response = await this._rpcRequest(
      { type: "SubscribeToActiveProviders", data: {} },
      "SubscribeToActiveProviders"
    );

    if (response.type !== "SubscribeToActiveProviders") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    return response.data.content;
  }

  async subscribeToJobs(data: SubscribeToJobsRequestData): Promise<number> {
    const parsedData = v.parse(SubscribeToJobsRequestDataSchema, data);

    const response = await this._rpcRequest(
      { type: "SubscribeToJobs", data: parsedData },
      "SubscribeToJobs"
    );

    if (response.type !== "SubscribeToJobs") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new SubscribeToJobsError(response.data);
    }

    return response.data.content;
  }

  //
  //#endregion

  //#region Private methods
  //

  /**
   * Start the RPC loop.
   */
  private async _rpcLoop() {
    let state: "readingLength" | "readingData" = "readingLength";

    let lengthBuffer = new Uint8Array(4);
    let lengthBufferIndex = 0;
    let length = 0;

    let dataBuffer: Uint8Array | null = null;
    let dataBufferIndex = 0;

    for await (const bytes of this._rpcStream) {
      let offset = 0;

      while (offset < bytes.length) {
        if (state === "readingLength") {
          const remaining = 4 - lengthBufferIndex;
          const toCopy = Math.min(remaining, bytes.length - offset);

          lengthBuffer.set(
            bytes.subarray(offset, offset + toCopy),
            lengthBufferIndex
          );

          lengthBufferIndex += toCopy;
          offset += toCopy;

          if (lengthBufferIndex === 4) {
            length = new DataView(lengthBuffer.buffer).getUint32(0);
            dataBuffer = new Uint8Array(length);
            dataBufferIndex = 0;
            lengthBufferIndex = 0;
            state = "readingData";
          }
        } else if (state === "readingData") {
          if (!dataBuffer) throw new Error("Data buffer is null unexpectedly!");

          const remaining = length - dataBufferIndex;
          const toCopy = Math.min(remaining, bytes.length - offset);

          dataBuffer.set(
            bytes.subarray(offset, offset + toCopy),
            dataBufferIndex
          );

          dataBufferIndex += toCopy;
          offset += toCopy;

          if (dataBufferIndex === length) {
            await this._handleInboundFrame(cbor.decode(dataBuffer));
            dataBuffer = null;
            state = "readingLength";
          }
        }
      }
    }
  }

  private async _handleInboundFrame(data: unknown) {
    console.debug("⬅️", data);
    const parseResult = v.safeParse(InboundFrameSchema, data);

    if (!parseResult.success) {
      console.error(
        `[RPC] Failed to parse inbound frame`,
        v.flatten(parseResult.issues)
      );

      return;
    }

    const frame = parseResult.output;

    switch (frame.kind) {
      case "Request":
        try {
          switch (frame.type) {
            case "EventOfferRemoved":
              await this.emitter.emit("offerRemoved", frame.data.payload);
              this._ack(frame.id);
              break;

            case "EventOfferUpdated":
              await this.emitter.emit("offerUpdated", frame.data.payload);
              this._ack(frame.id);
              break;

            case "EventProviderHeartbeat":
              await this.emitter.emit("providerHeartbeat", frame.data.payload);
              this._ack(frame.id);
              break;

            case "EventProviderUpdated":
              await this.emitter.emit("providerUpdated", frame.data.payload);
              this._ack(frame.id);
              break;

            case "EventJobUpdated":
              await this.emitter.emit("jobUpdated", frame.data.payload);
              this._ack(frame.id);
              break;

            case "ProviderCreateJob": {
              const cb = this._onProviderCreateJob;

              if (cb) {
                (async () => {
                  this._respondToInboundIpcRequest(frame.id, {
                    type: "ProviderCreateJob",
                    data: await cb(frame.data),
                  });
                })();
              } else {
                throw new Error("`.setOnProviderCreateJob` not called");
              }

              break;
            }

            case "ProviderPrepareJobConnection": {
              const cb = this._onProviderPrepareJobConnection;

              if (cb) {
                (async () => {
                  this._respondToInboundIpcRequest(frame.id, {
                    type: "ProviderPrepareJobConnection",
                    data: await cb(frame.data),
                  });
                })();
              } else {
                throw new Error(
                  "`.setOnProviderPrepareJobConnection` not called"
                );
              }

              break;
            }

            case "ProviderOpenJobConnection":
              (async () => {
                const stream = this._yamuxClient.open();

                const buffer = Buffer.alloc(8);
                buffer.writeBigInt64BE(BigInt(frame.data.connection_id));
                await writeAll(stream, buffer);

                this.emitter.emit("providerOpenJobConnection", {
                  ...frame.data,
                  stream,
                });
              })();

              this._ack(frame.id);
              break;

            default:
              throw unreachable(frame);
          }
        } catch (e: any) {
          console.error(
            `[RPC] Unhandled error during event emission`,
            frame,
            e
          );
        }

        break;

      case "Response":
        this._resolveOutboundIpcRequest(frame);
        break;

      default:
        throw unreachable(frame);
    }
  }

  private async _rpcRequest<T extends InboundResponseFrame>(
    request: Omit<OutboundRequestFrame, "kind" | "id">,
    expectedResponseType: T["type"]
  ): Promise<T> {
    const id = this._outboundRequestCounter++;

    // BUG:
    // @ts-ignore
    const resultingRequest: OutboundRequestFrame = {
      ...request,
      kind: "Request",
      id,
    };

    const deferred = new Deferred<InboundResponseFrame>();
    this._pendingOutboundRequests.set(id, deferred);

    console.debug("➡️", resultingRequest);
    await this._rpcWriteMutex.runExclusive(async () => {
      await writeCbor(this._rpcStream, resultingRequest);
    });

    const response = await deferred.promise;

    if (response.type !== expectedResponseType) {
      throw new Error(`[RPC] Unexpected response type: ${response.type}`);
    }

    return response as T;
  }

  private _resolveOutboundIpcRequest(frame: InboundResponseFrame) {
    const deferred = this._pendingOutboundRequests.get(frame.id);

    if (!deferred) {
      throw new Error(`[RPC] Unexpected response frame id: ${frame.id}`);
    }

    deferred.resolve(frame);
  }

  private async _respondToInboundIpcRequest(
    inboundRequestFrameId: number,
    response: Omit<OutboundResponseFrame, "kind" | "id">
  ) {
    // BUG:
    //@ts-ignore
    const resultingResponse: OutboundResponseFrame = {
      ...response,
      kind: "Response",
      id: inboundRequestFrameId,
    };

    console.debug("➡️", resultingResponse);
    await this._rpcWriteMutex.runExclusive(async () => {
      await writeCbor(this._rpcStream, resultingResponse);
    });
  }

  private async _ack(inboundRequestFrameId: number) {
    await this._respondToInboundIpcRequest(inboundRequestFrameId, {
      type: "Ack",
      data: undefined,
    });
  }

  //
  //#endregion
}

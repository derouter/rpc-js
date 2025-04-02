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
import type { ProviderOpenConnectionData } from "./rpc/inbound/request/provider/open_connection.js";
import type { InboundResponseFrame } from "./rpc/inbound/response.js";
import { ConsumerCompleteJobError } from "./rpc/inbound/response/consumer/complete_job.js";
import { ConsumerConfirmJobCompletionError } from "./rpc/inbound/response/consumer/confirm_job_completion.js";
import { ConsumerCreateJobError } from "./rpc/inbound/response/consumer/create_job.js";
import { ConsumerFailJobError } from "./rpc/inbound/response/consumer/fail_job.js";
import { ConsumerOpenConnectionError } from "./rpc/inbound/response/consumer/open_connection.js";
import { ConsumerSyncJobError } from "./rpc/inbound/response/consumer/sync_job.js";
import { ProviderCompleteJobError } from "./rpc/inbound/response/provider/complete_job.js";
import { ProviderCreateJobError } from "./rpc/inbound/response/provider/create_job.js";
import { ProviderFailJobError } from "./rpc/inbound/response/provider/fail_job.js";
import { ProviderProvideError } from "./rpc/inbound/response/provider/provide.js";
import { QueryActiveOffersError } from "./rpc/inbound/response/query/active_offers.js";
import { QueryJobsError } from "./rpc/inbound/response/query/jobs.js";
import { QueryOfferSnapshotsError } from "./rpc/inbound/response/query/offer_snapshots.js";
import { QueryProvidersError } from "./rpc/inbound/response/query/providers.js";
import { SubscribeToActiveOffersError } from "./rpc/inbound/response/subscription/active_offers.js";
import { CancelSubscriptionError } from "./rpc/inbound/response/subscription/cancel.js";
import { SubscribeToJobsError } from "./rpc/inbound/response/subscription/jobs.js";
import type { OutboundRequestFrame } from "./rpc/outbound/request.js";
import type { ConsumerCompleteJobData } from "./rpc/outbound/request/consumer/complete_job.js";
import type { ConsumerConfirmJobCompletionData } from "./rpc/outbound/request/consumer/confirm_job_completion.js";
import type { ConsumerCreateJobData } from "./rpc/outbound/request/consumer/create_job.js";
import type { ConsumerFailJobData } from "./rpc/outbound/request/consumer/fail_job.js";
import type { ConsumerOpenConnectionData } from "./rpc/outbound/request/consumer/open_connection.js";
import type { ConsumerSyncJobData } from "./rpc/outbound/request/consumer/sync_job.js";
import type { ProviderCompleteJobData } from "./rpc/outbound/request/provider/complete_job.js";
import type { ProviderCreateJobData } from "./rpc/outbound/request/provider/create_job.js";
import type { ProviderFailJobData } from "./rpc/outbound/request/provider/fail_job.js";
import type { ProviderProvideData } from "./rpc/outbound/request/provider/provide.js";
import type { QueryActiveOffersRequestData } from "./rpc/outbound/request/query/active_offers.js";
import type { QueryJobsRequestData } from "./rpc/outbound/request/query/jobs.js";
import type { QueryOfferSnapshotsRequestData } from "./rpc/outbound/request/query/offer_snapshots.js";
import type { QueryProvidersRequestData } from "./rpc/outbound/request/query/providers.js";
import type { SubscribeToActiveOffersRequestData } from "./rpc/outbound/request/subscription/active_offers.js";
import type { SubscribeToJobsRequestData } from "./rpc/outbound/request/subscription/jobs.js";
import type { OutboundResponseFrame } from "./rpc/outbound/response.js";
import { Deferred, Mutex, unreachable, writeAll, writeCbor } from "./util.js";

export {
  ConsumerCompleteJobError,
  ConsumerConfirmJobCompletionError,
  ConsumerCreateJobError,
  ConsumerFailJobError,
  ConsumerOpenConnectionError,
  ConsumerSyncJobError,
  ProviderCompleteJobError,
  ProviderCreateJobError,
  ProviderFailJobError,
  type JobRecord,
  type OfferRemoved,
  type OfferSnapshot,
  type ProviderHeartbeat,
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
    providerOpenConnection: ProviderOpenConnectionData & {
      stream: Duplex;
    };
  }>();

  private readonly _pendingOutboundRequests = new Map<
    number,
    Deferred<InboundResponseFrame>
  >();

  constructor(rpcHost: string, rpcPort: number) {
    this._socket = new net.Socket().connect(rpcPort, rpcHost);
    this._yamuxClient = new yamux.Client({ enableKeepAlive: true });

    this._socket.pipe(this._yamuxClient);
    this._yamuxClient.pipe(this._socket);

    // The first stream is the RPC stream.
    this._rpcStream = this._yamuxClient.open();

    this._rpcLoop();
  }

  //#region Consumer methods
  //

  /**
   * Request to open a new persistent connection with a provider.
   * @throws {ConsumerOpenConnectionError}.
   */
  async consumerOpenConnection(
    data: ConsumerOpenConnectionData
  ): Promise<{ stream: Duplex; connectionId: number }> {
    const response = await this._rpcRequest(
      { type: "ConsumerOpenConnection", data },
      "ConsumerOpenConnection"
    );

    if (response.type !== "ConsumerOpenConnection") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerOpenConnectionError(response.data);
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
   * Create a new service job locally.
   * @throws {ConsumerCreateJobError}
   */
  async consumerCreateJob(data: ConsumerCreateJobData): Promise<{
    database_job_id: number;
  }> {
    const response = await this._rpcRequest(
      { type: "ConsumerCreateJob", data },
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
   * Synchronize a previously {@link consumerCreateJob created} job
   * with Provider's data.
   * @throws {ConsumerSyncJobError}
   */
  async consumerSyncJob(data: ConsumerSyncJobData): Promise<void> {
    const response = await this._rpcRequest(
      { type: "ConsumerSyncJob", data },
      "ConsumerSyncJob"
    );

    if (response.type !== "ConsumerSyncJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerSyncJobError(response.data);
    }
  }

  /**
   * Mark a previously {@link consumerSyncJob synchronized} job as completed.
   * @throws {ConsumerCompleteJobError}
   */
  async consumerCompleteJob(data: ConsumerCompleteJobData): Promise<void> {
    const response = await this._rpcRequest(
      { type: "ConsumerCompleteJob", data },
      "ConsumerCompleteJob"
    );

    if (response.type !== "ConsumerCompleteJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ConsumerCompleteJobError(response.data);
    }
  }

  /**
   * Send a previosly {@link consumerCompleteJob completed}
   * job confirmation to the Provider.
   *
   * NOTE: The confirmation happens over the wire, thus may take some time.
   *
   * @throws {ConsumerConfirmJobCompletionError}
   */
  async consumerConfirmJobCompletion(
    data: ConsumerConfirmJobCompletionData
  ): Promise<"Ok" | "AlreadyConfirmed"> {
    const response = await this._rpcRequest(
      { type: "ConsumerConfirmJobCompletion", data },
      "ConsumerConfirmJobCompletion"
    );

    if (response.type !== "ConsumerConfirmJobCompletion") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (
      response.data.tag !== "Ok" &&
      response.data.tag !== "AlreadyConfirmed"
    ) {
      throw new ConsumerConfirmJobCompletionError(response.data);
    }

    return response.data.tag;
  }

  /**
   * Mark a previously {@link consumerCreateJob created} job as failed.
   * @throws {ConsumerFailJobError}
   */
  async consumerFailJob(
    data: ConsumerFailJobData
  ): Promise<"Ok" | "AlreadyFailed"> {
    const response = await this._rpcRequest(
      { type: "ConsumerFailJob", data },
      "ConsumerFailJob"
    );

    if (response.type !== "ConsumerFailJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok" && response.data.tag !== "AlreadyFailed") {
      throw new ConsumerFailJobError(response.data);
    }

    return response.data.tag;
  }

  //
  //#endregion

  //#region Provider methods
  //

  /**
   * Start providing offers.
   * @throws {ProviderProvideError}
   */
  async providerProvideOffer(data: ProviderProvideData): Promise<void> {
    const response = await this._rpcRequest(
      { type: "ProviderProvide", data },
      "ProviderProvide"
    );

    if (response.type !== "ProviderProvide") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ProviderProvideError(response.data);
    }
  }

  /**
   * Create a new service job on the backend.
   * @throws {ProviderCreateJobError}
   */
  async providerCreateJob(data: ProviderCreateJobData): Promise<{
    /**
     * Use this ID to reference the job locally.
     */
    database_job_id: number;

    /**
     * Send this ID to the Consumer.
     */
    provider_job_id: string;

    /**
     * Send this value to the Consumer
     */
    created_at_sync: number;
  }> {
    const response = await this._rpcRequest(
      { type: "ProviderCreateJob", data },
      "ProviderCreateJob"
    );

    if (response.type !== "ProviderCreateJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok") {
      throw new ProviderCreateJobError(response.data);
    }

    return response.data.content;
  }

  /**
   * Mark a previously {@link providerCreateJob created} job as completed locally.
   * @throws {ProviderCompleteJobError}
   */
  async providerCompleteJob(data: ProviderCompleteJobData): Promise<{
    tag: "Ok" | "AlreadyCompleted";
    completed_at_sync: number;
  }> {
    const response = await this._rpcRequest(
      { type: "ProviderCompleteJob", data },
      "ProviderCompleteJob"
    );

    if (response.type !== "ProviderCompleteJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (
      response.data.tag !== "Ok" &&
      response.data.tag !== "AlreadyCompleted"
    ) {
      throw new ProviderCompleteJobError(response.data);
    }

    return {
      tag: response.data.tag,
      completed_at_sync: response.data.content.completed_at_sync,
    };
  }

  /**
   * Mark a previously {@link providerCreateJob created} job as failed locally.
   * @throws {ProviderFailJobError}
   */
  async providerFailJob(
    data: ProviderFailJobData
  ): Promise<"Ok" | "AlreadyFailed"> {
    const response = await this._rpcRequest(
      { type: "ProviderFailJob", data },
      "ProviderFailJob"
    );

    if (response.type !== "ProviderFailJob") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    if (response.data.tag !== "Ok" && response.data.tag !== "AlreadyFailed") {
      throw new ProviderFailJobError(response.data);
    }

    return response.data.tag;
  }

  //
  //#endregion

  //#region Queries
  //

  async queryActiveOffers(
    data: QueryActiveOffersRequestData
  ): Promise<OfferSnapshot[]> {
    const response = await this._rpcRequest(
      { type: "QueryActiveOffers", data },
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
    const response = await this._rpcRequest(
      { type: "QueryJobs", data },
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
    const response = await this._rpcRequest(
      { type: "QueryOfferSnapshots", data },
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
    const response = await this._rpcRequest(
      { type: "QueryProviders", data },
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
    const response = await this._rpcRequest(
      { type: "SubscribeToActiveOffers", data },
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
    const response = await this._rpcRequest(
      { type: "SubscribeToJobs", data },
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

            case "ProviderOpenConnection":
              (async () => {
                const stream = this._yamuxClient.open();

                const buffer = Buffer.alloc(8);
                buffer.writeBigInt64BE(BigInt(frame.data.connection_id));
                await writeAll(stream, buffer);

                this.emitter.emit("providerOpenConnection", {
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
    const resultingResponse: OutboundResponseFrame = {
      ...response,
      kind: "Response",
      id: inboundRequestFrameId,
    };

    await this._rpcWriteMutex.runExclusive(async () => {
      await writeCbor(this._rpcStream, resultingResponse);
    });
  }

  private async _ack(inboundRequestFrameId: number) {
    await this._respondToInboundIpcRequest(inboundRequestFrameId, {
      type: "Ack",
    });
  }

  //
  //#endregion
}

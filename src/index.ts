import * as cbor from "cbor2";
import Emittery from "emittery";
import net from "node:net";
import { Duplex } from "node:stream";
import * as v from "valibot";
import yamux from "yamux-js";
import { InboundFrameSchema } from "./rpc/inbound.js";
import type { OfferRemovedData } from "./rpc/inbound/request/OfferRemoved.js";
import type { OfferUpdatedData } from "./rpc/inbound/request/OfferUpdated.js";
import type { ProviderOpenConnectionData } from "./rpc/inbound/request/provider/ProviderOpenConnection.js";
import type { ProviderHeartbeatData } from "./rpc/inbound/request/ProviderHeartbeat.js";
import type { ProviderUpdatedData } from "./rpc/inbound/request/ProviderUpdated.js";
import type { InboundResponseFrame } from "./rpc/inbound/response.js";
import { ConsumerCompleteJobError } from "./rpc/inbound/response/consumer/ConsumerCompleteJob.js";
import { ConsumerConfirmJobCompletionError } from "./rpc/inbound/response/consumer/ConsumerConfirmJobCompletion.js";
import { ConsumerCreateJobError } from "./rpc/inbound/response/consumer/ConsumerCreateJob.js";
import { ConsumerFailJobError } from "./rpc/inbound/response/consumer/ConsumerFailJob.js";
import { ConsumerOpenConnectionError } from "./rpc/inbound/response/consumer/ConsumerOpenConnection.js";
import { ConsumerSyncJobError } from "./rpc/inbound/response/consumer/ConsumerSyncJob.js";
import { ProviderCompleteJobError } from "./rpc/inbound/response/provider/ProviderCompleteJob.js";
import { ProviderCreateJobError } from "./rpc/inbound/response/provider/ProviderCreateJob.js";
import { ProviderFailJobError } from "./rpc/inbound/response/provider/ProviderFailJob.js";
import type { OutboundRequestFrame } from "./rpc/outbound/request.js";
import type { ConsumerCompleteJobData } from "./rpc/outbound/request/consumer/ConsumerCompleteJob.js";
import type { ConsumerConfig } from "./rpc/outbound/request/consumer/ConsumerConfig.js";
import type { ConsumerConfirmJobCompletionData } from "./rpc/outbound/request/consumer/ConsumerConfirmJobCompletion.js";
import type { ConsumerCreateJobData } from "./rpc/outbound/request/consumer/ConsumerCreateJob.js";
import type { ConsumerFailJobData } from "./rpc/outbound/request/consumer/ConsumerFailJob.js";
import type { ConsumerOpenConnectionData } from "./rpc/outbound/request/consumer/ConsumerOpenConnection.js";
import type { ConsumerSyncJobData } from "./rpc/outbound/request/consumer/ConsumerSyncJob.js";
import type { ProviderCompleteJobData } from "./rpc/outbound/request/provider/ProviderCompleteJob.js";
import type { ProviderConfig } from "./rpc/outbound/request/provider/ProviderConfig.js";
import type { ProviderCreateJobData } from "./rpc/outbound/request/provider/ProviderCreateJob.js";
import type { ProviderFailJobData } from "./rpc/outbound/request/provider/ProviderFailJob.js";
import { Deferred, unreachable, writeAll, writeCbor } from "./util.js";

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
  type ConsumerConfig,
  type OfferRemovedData,
  type OfferUpdatedData,
  type ProviderHeartbeatData,
  type ProviderUpdatedData,
};

export enum Auth {
  Provider = 0,
  Consumer = 1,
}

export class RPC {
  private _yamuxClient;
  private _rpcStream;
  private _socket;
  private _outboundRequestCounter = 0;

  readonly emitter = new Emittery<{
    offerRemoved: OfferRemovedData;
    offerUpdated: OfferUpdatedData;
    providerHeartbeat: ProviderHeartbeatData;
    providerUpdated: ProviderUpdatedData;
    providerOpenConnection: ProviderOpenConnectionData & {
      stream: Duplex;
    };
  }>();

  private readonly _pendingOutboundRequests = new Map<
    number,
    Deferred<InboundResponseFrame>
  >();

  constructor(rpcHost: string, rpcPort: number, auth: Auth) {
    this._socket = new net.Socket().connect(rpcPort, rpcHost);

    const buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(auth);
    this._socket.write(buffer);

    this._yamuxClient = new yamux.Client({ enableKeepAlive: true });

    this._socket.pipe(this._yamuxClient);
    this._yamuxClient.pipe(this._socket);

    // The first stream is the RPC stream.
    this._rpcStream = this._yamuxClient.open();

    this._rpcLoop();
  }

  //#region Consumer methods
  //

  async consumerConfig(data: ConsumerConfig): Promise<void> {
    const response = await this._rpcRequest(
      { type: "ConsumerConfig", data },
      "ConsumerConfig"
    );

    if (response.type !== "ConsumerConfig") {
      throw `Unexpected IPC response frame type: ${response.type}`;
    }

    for (const data of response.data.providers) {
      await this.emitter.emit("providerUpdated", data);
    }

    for (const data of response.data.offers) {
      await this.emitter.emit("offerUpdated", data);
    }
  }

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
      throw new ConsumerOpenConnectionError(
        response.data.tag,
        "content" in response.data ? response.data.content : response.data.tag
      );
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
      throw new ConsumerCreateJobError(response.data.tag, response.data.tag);
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
      throw new ConsumerSyncJobError(response.data.tag);
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
      throw new ConsumerCompleteJobError(
        response.data.tag,
        "content" in response.data
          ? response.data.content.message
          : response.data.tag
      );
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
      throw new ConsumerConfirmJobCompletionError(
        response.data.tag,
        "content" in response.data
          ? response.data.content.message
          : response.data.tag
      );
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
      throw new ConsumerFailJobError(response.data.tag);
    }

    return response.data.tag;
  }

  //
  //#endregion

  //#region Provider methods
  //

  async providerConfig(data: ProviderConfig): Promise<void> {
    const response = await this._rpcRequest(
      { type: "ProviderConfig", data },
      "ProviderConfig"
    );

    if (response.type !== "ProviderConfig") {
      throw `Unexpected IPC response frame type: ${response.type}`;
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
      throw new ProviderCreateJobError(response.data.tag);
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
      throw new ProviderCompleteJobError(
        response.data.tag,
        "content" in response.data
          ? response.data.content.message
          : response.data.tag
      );
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
      throw new ProviderFailJobError(response.data.tag);
    }

    return response.data.tag;
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
            case "OfferRemoved":
              await this.emitter.emit("offerRemoved", frame.data);
              break;

            case "OfferUpdated":
              await this.emitter.emit("offerUpdated", frame.data);
              break;

            case "ProviderHeartbeat":
              await this.emitter.emit("providerHeartbeat", frame.data);
              break;

            case "ProviderUpdated":
              await this.emitter.emit("providerUpdated", frame.data);
              break;

            case "ProviderOpenConnection":
              (async () => {
                const stream = this._yamuxClient.open();

                const buffer = Buffer.alloc(8);
                buffer.writeBigInt64BE(BigInt(frame.data.connection_id));
                await writeAll(stream, buffer);

                await this.emitter.emit("providerOpenConnection", {
                  ...frame.data,
                  stream,
                });
              })();

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

    await writeCbor(this._rpcStream, resultingRequest);
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

  //
  //#endregion
}

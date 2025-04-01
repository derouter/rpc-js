import * as cbor from "cbor2";
import { Readable, Writable } from "node:stream";

/**
 * Would panic upon non-exhaustive-ness.
 * @example default: unreachable(case)
 */
export function unreachable(arg: never) {
  return arg;
}

/**
 * Write all data to a stream.
 */
export function writeAll(stream: Writable, buffer: any) {
  return new Promise<void>((resolve, reject) => {
    const canWrite = stream.write(buffer, (err) => {
      if (err) return reject(err);
      resolve();
    });

    if (!canWrite) {
      stream.once("drain", () => {
        resolve();
      });
    }
  });
}

/**
 * An object promised to be resolved in the future.
 *
 * @example
 * const deferred = new Deferred<number>();
 * deferred.promise.then(console.log);
 * deferred.resolve(42);
 */
export class Deferred<T> {
  readonly promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason: any) => void;
  private _resolved = false;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get resolved() {
    return this._resolved;
  }

  resolve(value: T | PromiseLike<T>): void {
    this._resolved = true;
    this._resolve(value);
  }

  reject(reason: any): void {
    this._reject(reason);
  }
}

/**
 * Write CBOR-encoded `data` to a `stream` with 4 bytes length prefix.
 */
export async function writeCbor(stream: Writable, data: any): Promise<void> {
  const dataBuffer = cbor.encode(data);
  const lengthBuffer = Buffer.allocUnsafe(4);
  lengthBuffer.writeUInt32BE(dataBuffer.length);
  const combinedBuffer = Buffer.concat([lengthBuffer, dataBuffer]);
  await writeAll(stream, combinedBuffer);
}

/**
 * Read exactly 4 (length) + message bytes from a `stream`.
 */
export async function readCborOnce<T>(
  stream: Readable
): Promise<T | undefined> {
  let state: "readingLength" | "readingData" = "readingLength";
  let result = new Deferred<T | undefined>();
  let streamEnded = false;
  let length: number | undefined;

  stream.once("readable", () => {
    let chunk: Buffer | undefined;

    loop: while (true) {
      switch (state) {
        case "readingLength":
          while ((chunk = stream.read(4)) === null) {}
          if (streamEnded) return;

          length = chunk!.readUInt32BE();
          state = "readingData";
          continue loop;

        case "readingData":
          while ((chunk = stream.read(length!)) === null) {}
          if (streamEnded) return;

          result.resolve(cbor.decode(chunk!));
          break loop;
      }
    }
  });

  stream.once("end", () => {
    streamEnded = true;
    result.resolve(undefined);
  });

  return result.promise;
}

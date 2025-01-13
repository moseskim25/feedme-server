declare module "stream-to-buffer" {
  import { Readable } from "stream";

  function streamToBuffer(
    stream: Readable,
    callback: (err: Error | null, buffer: Buffer) => void
  ): void;

  export = streamToBuffer;
}

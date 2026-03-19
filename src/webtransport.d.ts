// WebTransport API type declarations
// https://www.w3.org/TR/webtransport/

interface WebTransportOptions {
  allowPooling?: boolean;
  congestionControl?: string;
  requireUnreliable?: boolean;
  serverCertificateHashes?: WebTransportHash[];
}

interface WebTransportHash {
  algorithm: string;
  value: BufferSource;
}

interface WebTransportDatagramDuplexStream {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  maxDatagramSize: number;
}

declare class WebTransport {
  constructor(url: string, options?: WebTransportOptions);
  readonly ready: Promise<void>;
  readonly closed: Promise<WebTransportCloseInfo>;
  readonly datagrams: WebTransportDatagramDuplexStream;
  close(closeInfo?: WebTransportCloseInfo): void;
  createBidirectionalStream(): Promise<WebTransportBidirectionalStream>;
  createUnidirectionalStream(): Promise<WritableStream>;
}

interface WebTransportCloseInfo {
  closeCode?: number;
  reason?: string;
}

interface WebTransportBidirectionalStream {
  readonly readable: ReadableStream;
  readonly writable: WritableStream;
}

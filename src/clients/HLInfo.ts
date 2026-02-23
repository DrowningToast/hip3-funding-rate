import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";

// 2. Set up client with transport
const transport = new HttpTransport();
export const HLInfo = new InfoClient({ transport });

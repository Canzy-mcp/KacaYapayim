import "server-only";

// Never serialize thrown objects here: database/provider messages may contain user input.
export function logFailure(operation:string, code="OPERATION_FAILED", requestId?:string){
  console.error(JSON.stringify({timestamp:new Date().toISOString(),operation,code,...(requestId?{requestId}:{})}));
}

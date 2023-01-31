import React from "react";

export default function useOnMount(handler: () => void) {
  return React.useEffect(handler, []);
}

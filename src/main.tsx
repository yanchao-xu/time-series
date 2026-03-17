import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import type { MountParams, MountReturn } from "../icp-extension.types";

export default function mount<T>(
  element: HTMLElement,
  { params, formApi, messageApi, restApi, i18nApi, routerApi }: MountParams<T>,
): MountReturn<T> {
  const root = createRoot(element);
  root.render(<App {...params} />);

  return () => {
    root.unmount();
  };
}

export const schema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      default: "",
      description: "The title of time series chart.",
    },
    apiEndpoint: {
      type: "string",
      default: "",
      description:
        "The endpoint of the REST API. The response should be a JSON array of objects. eg: [{timestamp: '2023-01-01T00:00:00Z', value: 10}, ...]",
    },
    comparisonEndpoint: {
      type: "string",
      default: "",
      description: "The endpoint of the REST API for comparison.",
    },
    timestampField: {
      type: "string",
      default: "timestamp",
      description: "The field name of timestamp.",
    },
    valueField: {
      type: "string",
      default: "value",
      description: "The field name of value.",
    },
    queryParams: {
      type: "object",
      title: "queryParams",
      description: "Query parameters. used to filter data.",
    },
  },
  required: ["apiEndpoint"],
};

// uncomment to provide mock REST API only for form designer preview
/*
export const mockRestApi = {
  get: async  () => {}
  put: async  () => {}
  post: async  () => {}
  delete: async  () => {}
}
*/

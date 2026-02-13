#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { search, getSolution, getStats } from "../src/search.js";

const server = new Server(
  { name: "claude-err", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_errors",
      description:
        "Search past error-solution pairs across all projects. " +
        "Use when encountering an error to check if a similar error " +
        "was previously solved. Returns matching errors with solutions.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Error message, stack trace fragment, or error description",
          },
          project: {
            type: "string",
            description: "Optional: filter to a specific project name",
          },
          limit: {
            type: "number",
            description: "Max results to return (default: 5)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_solution",
      description: "Get the full solution details for a specific error ID",
      inputSchema: {
        type: "object",
        properties: {
          error_id: {
            type: "string",
            description: "The error ID from search results",
          },
        },
        required: ["error_id"],
      },
    },
    {
      name: "oracle_stats",
      description: "Get claude-err database statistics",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search_errors": {
      const results = await search(args.query, args.project, args.limit || 5);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
    case "get_solution": {
      const solution = await getSolution(args.error_id);
      return {
        content: [{ type: "text", text: JSON.stringify(solution, null, 2) }],
      };
    }
    case "oracle_stats": {
      const stats = await getStats();
      return {
        content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

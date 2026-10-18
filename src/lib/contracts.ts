// Snapshot of Ace Data Cloud's Dify plugin API mapping; source revision is documented in README.md.
export type EndpointSpec = {
  method: string; path: string; operation: string; schema: Record<string, unknown>;
  properties: Record<string, Record<string, unknown>>; parameters?: Array<{ name: string; in: string; required?: boolean; schema?: Record<string, unknown> }>;
  defaults?: Record<string, unknown>; fixed?: Record<string, unknown>; allow_empty?: string[]; query_actions?: string[];
  media_response?: boolean; selector?: Record<string, string>; selector_default?: string; read_only?: boolean;
  asynchronous?: boolean; destructive?: boolean;
};
export const serviceName: string = "NanoBanana";
export const taskPath = "/nano-banana/tasks";
export const endpoints: Record<string, EndpointSpec> = {
  "nano_banana_generate_image": {
    "method": "POST",
    "path": "/nano-banana/images",
    "operation": "generate",
    "schema": {
      "type": "object",
      "required": [
        "action",
        "prompt"
      ],
      "properties": {
        "action": {
          "enum": [
            "generate",
            "edit"
          ],
          "type": "string"
        },
        "model": {
          "type": "string",
          "enum": [
            "nano-banana",
            "nano-banana-2-lite",
            "nano-banana-2",
            "nano-banana-2.1",
            "nano-banana-pro",
            "nano-banana:official",
            "nano-banana-2-lite:official",
            "nano-banana-2:official",
            "nano-banana-pro:official"
          ]
        },
        "prompt": {
          "type": "string"
        },
        "image_urls": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "count": {
          "type": "integer",
          "minimum": 1,
          "maximum": 4
        },
        "aspect_ratio": {
          "type": "string",
          "enum": [
            "1:1",
            "3:2",
            "2:3",
            "16:9",
            "9:16",
            "4:3",
            "3:4"
          ]
        },
        "resolution": {
          "type": "string",
          "enum": [
            "1K",
            "2K",
            "4K"
          ]
        },
        "callback_url": {
          "type": "string"
        },
        "async": {
          "type": "boolean"
        }
      }
    },
    "properties": {
      "action": {
        "enum": [
          "generate",
          "edit"
        ],
        "type": "string"
      },
      "model": {
        "type": "string",
        "enum": [
          "nano-banana",
          "nano-banana-2-lite",
          "nano-banana-2",
          "nano-banana-2.1",
          "nano-banana-pro",
          "nano-banana:official",
          "nano-banana-2-lite:official",
          "nano-banana-2:official",
          "nano-banana-pro:official"
        ]
      },
      "prompt": {
        "type": "string"
      },
      "image_urls": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "count": {
        "type": "integer",
        "minimum": 1,
        "maximum": 4
      },
      "aspect_ratio": {
        "type": "string",
        "enum": [
          "1:1",
          "3:2",
          "2:3",
          "16:9",
          "9:16",
          "4:3",
          "3:4"
        ]
      },
      "resolution": {
        "type": "string",
        "enum": [
          "1K",
          "2K",
          "4K"
        ]
      },
      "callback_url": {
        "type": "string"
      },
      "async": {
        "type": "boolean"
      }
    },
    "parameters": [],
    "defaults": {
      "model": "nano-banana-2-lite",
      "aspect_ratio": "1:1",
      "resolution": "1K",
      "count": 1
    },
    "fixed": {
      "action": "generate"
    },
    "allow_empty": [],
    "query_actions": [],
    "media_response": true
  },
  "nano_banana_task_retrieve": {
    "method": "POST",
    "path": "/nano-banana/tasks",
    "operation": "task",
    "schema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "action": {
          "enum": [
            "retrieve",
            "retrieve_batch"
          ],
          "type": "string"
        }
      }
    },
    "properties": {
      "id": {
        "type": "string"
      },
      "ids": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "action": {
        "enum": [
          "retrieve",
          "retrieve_batch"
        ],
        "type": "string"
      }
    },
    "parameters": [],
    "defaults": {
      "wait_seconds": 0
    },
    "fixed": {},
    "allow_empty": [],
    "query_actions": [
      "retrieve",
      "retrieve_batch",
      "list",
      "presets"
    ],
    "media_response": false
  }
};

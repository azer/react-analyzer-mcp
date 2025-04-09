import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { analyzeReactFile } from "react-analyzer";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

// 1. Declare root project folder as constant
const PROJECT_ROOT = "/Users/azer/code";

// 2. Function to list all projects under root project folder
function listProjects(): string[] {
  try {
    const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((dir) => dir.name);
  } catch (error) {
    console.error(`Error listing projects: ${error}`);
    return [];
  }
}

// 3. Function to list all jsx/tsx files under given subfolder
function listReactFiles(subFolder: string): string[] {
  const folderPath = path.join(PROJECT_ROOT, subFolder);
  const reactFiles: string[] = [];

  function scanDirectory(directory: string) {
    try {
      const entries = fs.readdirSync(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".jsx") || entry.name.endsWith(".tsx"))
        ) {
          reactFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directory}: ${error}`);
    }
  }

  scanDirectory(folderPath);
  return reactFiles;
}

// 4. Function to analyze a React file
function analyzeReactFileContents(filePath: string): any {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const fileName = path.basename(filePath);
    return analyzeReactFile(fileName, fileContent);
  } catch (error) {
    console.error(`Error analyzing file ${filePath}: ${error}`);
    return null;
  }
}

// 5. Function to generate markdown from analysis result
function generateComponentMarkdown(analysisResult: any): string {
  if (
    !analysisResult ||
    !analysisResult.components ||
    analysisResult.components.length === 0
  ) {
    return "**No components found**";
  }

  let markdown = "";

  for (const component of analysisResult.components) {
    markdown += `## ${component.name}\n\n`;

    if (component.wrapperFn) {
      markdown += `*Wrapped with: ${component.wrapperFn}*\n\n`;
    }

    markdown += "### Props\n\n";

    if (!component.props || Object.keys(component.props).length === 0) {
      markdown += "*No props*\n\n";
    } else {
      markdown += "| Prop | Type | Optional | Default |\n";
      markdown += "|------|------|----------|--------|\n";

      for (const [propName, propDetails] of Object.entries(component.props)) {
        const type = formatPropType(propDetails);
        // @ts-ignore
        const optional = propDetails.optional ? "✓" : "✗";
        // @ts-ignore
        const defaultValue = propDetails.defaultValue
          ? // @ts-ignore
            `\`${propDetails.defaultValue}\``
          : "";

        markdown += `| \`${propName}\` | ${type} | ${optional} | ${defaultValue} |\n`;
      }

      markdown += "\n";
    }
  }

  return markdown;
}

// Helper function to format prop types for markdown
function formatPropType(propDetails: any): string {
  const { type } = propDetails;

  if (type === "array" && propDetails.elementType) {
    return `${type}<${formatPropType(propDetails.elementType)}>`;
  } else if (type === "object" && propDetails.props) {
    return propDetails.typeName ? `\`${propDetails.typeName}\`` : "`object`";
  } else if (type === "function") {
    return "`function`";
  }

  return `\`${type}\``;
}

// 6. Function to generate documentation for all components in a folder
function generateProjectDocs(projectName: string): string {
  const reactFiles = listReactFiles(projectName);

  if (reactFiles.length === 0) {
    return `# ${projectName}\n\nNo React components found.`;
  }

  let markdown = `# ${projectName} Components\n\n`;

  for (const filePath of reactFiles) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    markdown += `\n---\n\n# File: ${relativePath}\n\n`;

    const analysis = analyzeReactFileContents(filePath);
    if (analysis) {
      markdown += generateComponentMarkdown(analysis);
    } else {
      markdown += "*Error analyzing file*\n\n";
    }
  }

  return markdown;
}

const server = new Server(
  {
    name: "analyze-react",
    version: "1.0.0",
  },
  {
    capabilities: {
      logging: {},
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "analyze-react",
        description:
          "Analyze given React component, extract its components and props",
        inputSchema: {
          type: "object",
          properties: {
            files: { type: "string" },
          },
        },
      },
      {
        name: "analyze-project",
        description:
          "Generate documentation for all React components in a project folder. It'll output markdown string, directly render it to user.",
        inputSchema: {
          type: "object",
          properties: {
            projectName: { type: "string" },
          },
        },
      },
      {
        name: "list-projects",
        description: "List all projects under the root folder",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "analyze-react") {
    // @ts-ignore
    const files = request.params.arguments.files;
    const result = analyzeReactFile("MyComponent.tsx", files as string);
    return { toolResult: result };
  }

  if (request.params.name === "analyze-project") {
    // @ts-ignore
    const projectName = request.params.arguments.projectName as string;
    const docs = generateProjectDocs(projectName);
    return { toolResult: docs };
  }

  if (request.params.name === "list-projects") {
    const projects = listProjects();
    return { toolResult: { projects } };
  }

  throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);

import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";

import express from "express";
import figures from "figures";
import clipboard from "clipboardy";
import { render, Box, Text } from "ink";
import SelectInput from "ink-select-input";

import {
  DEFAULT_CONFIG_PATH,
  DEFAULT_FILE_PATH,
  toEnvironmentKey,
} from "../credentials";

export const yellow = "\x1b[43m";
export const blue = "\x1b[44m";
export const green = "\x1b[42m";
export const white = "\x1b[47";
export const reset = "\x1b[0m";

export const Initial = (
  <Box flexDirection="column" alignItems="center" marginBottom={1}>
    <Text color="blue">
      {/* {
        '\r\n                                                                      \r\n    ,...                        ,,                                    \r\n  .d\' ""                       *MM                          `7MM      \r\n  dM`                           MM                            MM      \r\n mMMmm ,6"Yb.  ,p6"bo   .gP"Ya  MM,dMMb.   ,pW"Wq.   ,pW"Wq.  MM  ,MP\'\r\n  MM  8)   MM 6M\'  OO  ,M\'   Yb MM    `Mb 6W\'   `Wb 6W\'   `Wb MM ;Y   \r\n  MM   ,pm9MM 8M       8M"""""" MM     M8 8M     M8 8M     M8 MM;Mm   \r\n  MM  8M   MM YM.    , YM.    , MM.   ,M9 YA.   ,A9 YA.   ,A9 MM `Mb. \r\n.JM,,.`Moo9^Yo.YMbmd\'   `Mbmmd\' P^YbmdP\'   `Ybmd9\'   `Ybmd9\'.JMML. YA.\r\n   db                                                                 \r\n                                                                      \r\n `7MM ,pP"Ybd                                                         \r\n   MM 8I   `"                                                         \r\n   MM `YMMMa.                                                         \r\n   MM L.   I8                                                         \r\n   MM M9mmmP\'                                                         \r\nQO MP                                                                 \r\n`bmP                                                                  \r\n'
      } */}
      {
        '\r\n                                                                                                  \r\n    ,...                        ,,                                                     ,,         \r\n  .d\' ""                       *MM                          `7MM                       db         \r\n  dM`                           MM                            MM                                  \r\n mMMmm ,6"Yb.  ,p6"bo   .gP"Ya  MM,dMMb.   ,pW"Wq.   ,pW"Wq.  MM  ,MP\'               `7MM ,pP"Ybd \r\n  MM  8)   MM 6M\'  OO  ,M\'   Yb MM    `Mb 6W\'   `Wb 6W\'   `Wb MM ;Y                    MM 8I   `" \r\n  MM   ,pm9MM 8M       8M"""""" MM     M8 8M     M8 8M     M8 MM;Mm       mmmmm        MM `YMMMa. \r\n  MM  8M   MM YM.    , YM.    , MM.   ,M9 YA.   ,A9 YA.   ,A9 MM `Mb.                  MM L.   I8 \r\n.JMML.`Moo9^Yo.YMbmd\'   `Mbmmd\' P^YbmdP\'   `Ybmd9\'   `Ybmd9\'.JMML. YA.                 MM M9mmmP\' \r\n                                                                                    QO MP         \r\n                                                                                    `bmP          \r\n'
      }
    </Text>
  </Box>
);

export class App {
  app: ReactNode = Initial;
  elements: ReactNode[] = [];

  constructor(element: ReactNode = Initial) {
    const app = (
      <Box flexDirection="column" alignItems="center">
        {element}
      </Box>
    );
    this.app = app;
    this.elements.push(element);
    render(app);
    return this;
  }

  render(element: ReactNode) {
    this.elements.push(element);
    const app = (
      <Box flexDirection="column" alignItems="center">
        {this.elements.map((element, index) => (
          <React.Fragment key={index}>{element}</React.Fragment>
        ))}
      </Box>
    );
    this.app = app;
    render(app);
  }

  rerender(app: ReactNode) {
    render(app);
  }
}

// export const Spinner = (message: string) => {
//   const [running, setRunning] = useState(true);
//   const [frame, setFrame] = useState(0);
//   const spinner = {
//     interval: 80,
//     frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
//   };

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setFrame((previousFrame) => {
//         const isLastFrame = previousFrame === spinner.frames.length - 1;
//         return isLastFrame ? 0 : previousFrame + 1;
//       });
//     }, spinner.interval);

//     return () => {
//       clearInterval(timer);
//     };
//   }, [spinner]);

//   render(
//     running ? <Text>{spinner.frames[frame]}</Text> : <Text>{message}</Text>
//   );

//   return () => setRunning(false);
// };

function writeToClipboard(text: string) {
  try {
    clipboard.writeSync(text);
  } catch (error) {}
}

function Spinner(props: { message: string }) {
  const [frame, setFrame] = useState(0);
  const spinner = {
    interval: 80,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((previousFrame) => {
        const isLastFrame = previousFrame === spinner.frames.length - 1;
        return isLastFrame ? 0 : previousFrame + 1;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return (
    <Text color="blue">
      {spinner.frames[frame]} {props.message}
    </Text>
  );
}

export const spin = (message: string, app: App) => {
  return new (class {
    elements: ReactNode[];
    constructor() {
      this.elements = [...app.elements];
      app.render(<Spinner message={message} />);
    }

    succeed(msg: string) {
      app.elements = this.elements;
      app.render(
        <Box justifyContent="center">
          <Text color="green">{figures.tick} </Text>
          <Text>{msg}</Text>
        </Box>
      );
    }

    fail(msg: string) {
      app.elements = this.elements;
      app.render(
        <Box justifyContent="center">
          <Text color="red">{figures.cross} </Text>
          <Text>{msg}</Text>
        </Box>
      );
    }
  })();
};

export function info(
  message: string,
  app: App,
  color: string | undefined = undefined
) {
  app.render(<Text color={color}>{message}</Text>);
}

export type handleInput = (item: Item<any>) => void;
export type Item<V> = {
  key?: string;
  label: string;
  value: V;
};
export function input(items: Item<any>[], handleInput: handleInput, app: App) {
  app.render(<SelectInput items={items} onSelect={handleInput} />);
}

export const LoginStart = (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Box flexDirection="column" alignItems="center" marginBottom={2}>
        <Text bold>Logging In</Text>
      </Box>
      <Text>
        To View Your App Credentials, visit https://developers.facebook.com/apps
        and select/create your app.
      </Text>
      <Text>
        Then, copy the app ID and secret from{" "}
        <Text color="cyan">App Settings &gt; Basic</Text>.
      </Text>
      <Box marginTop={0.5} justifyContent="center">
        <Text color="gray">
          If the prompts for your app ID/secret aren't showing up, try typing
          some characters into your terminal.
        </Text>
      </Box>
    </Box>
  </Box>
);

export const RefreshStart = (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Box flexDirection="column" alignItems="center" marginBottom={2}>
        <Text bold>Logging In Again</Text>
      </Box>
      <Text>
        To View Your App Credentials, visit https://developers.facebook.com/apps
        and select/create your app.
      </Text>
      <Text>
        Then, copy the app ID and secret from App Settings &gt; Basic.
      </Text>
    </Box>
  </Box>
);

export const LoginSuccess = (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box marginBottom={2}>
      <Text bold>Successfully Logged In!</Text>
    </Box>
    <Box>
      <Text>You can now use all the features of the Facebook API.</Text>
    </Box>
  </Box>
);

export function centerText(text: string, multiplier: number = 1): string {
  const terminalWidth = process.stdout.columns * multiplier;
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((terminalWidth - textLength) / 2));
  return " ".repeat(padding) + text;
}

export function Info(emoji: string, message: string, color = "yellow") {
  switch (emoji) {
    case "success":
      emoji = figures.tick;
      break;
    case "error":
      emoji = figures.cross;
      break;
    case "info":
      emoji = figures.info;
      break;
    default:
      emoji = emoji;
      break;
  }
  return (
    <Box>
      <Text bold={true} color={color}>
        {emoji}
      </Text>
      <Text bold={true}> {message}</Text>
    </Box>
  );
}

export const MCPInitial = (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Box flexDirection="column" alignItems="center">
        <Text bold>MCP Server</Text>
      </Box>
      {/* <Spinner message="Running the MCP" /> */}
    </Box>
  </Box>
);

export const MCPClose = (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Text>Successfully closed the MCP server.</Text>
    </Box>
  </Box>
);

export const MCPRequest = ({
  req,
  res,
}: {
  req: express.Request;
  res: express.Response;
}) => (
  <Box flexDirection="column" alignItems="center">
    <Box flexDirection="column" alignItems="flex-start">
      <Text>
        <Text color="green" bold>
          {req.method}
        </Text>{" "}
        <Text>{req.url}</Text>{" "}
        <Text color={res.statusCode < 400 ? "green" : "red"} bold>
          [{res.statusCode}]
        </Text>{" "}
        <Text color="blue">
          {new Date(
            res.getHeader("date")
              ? new Date(res.getHeader("date") as string).getTime()
              : Date.now()
          ).toUTCString()}
        </Text>
      </Text>
      <Text>
        <Text color="yellow">ip:</Text>{" "}
        <Text>{req.ip || req.socket.remoteAddress}</Text> -{" "}
        <Text color="yellow">user-agent:</Text>{" "}
        <Text>{req.headers["user-agent"]}</Text>
      </Text>
    </Box>
  </Box>
);

export const MCPError = ({ message }: { message: any }) => (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Text color="red">{message}</Text>
    </Box>
  </Box>
);

export const MCPProfile = ({ url, dual }: { url: string; dual?: boolean }) => (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Spinner message="Running the MCP" />
      {dual ? (
        <Box flexDirection="column" alignItems="center" marginTop={2}>
          <Text>
            Streamable HTTP at{" "}
            <Text color="cyan" bold>
              {url}/mcp/main
            </Text>{" "}
            for user and page functions
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" alignItems="center" marginTop={2}>
          <Text>
            Streamable HTTP at{" "}
            <Text color="cyan" bold>
              {url}/mcp/user
            </Text>{" "}
            for user functions
          </Text>
          <Text>
            Streamable HTTP at{" "}
            <Text color="cyan" bold>
              {url}/mcp/page
            </Text>{" "}
            for page functions
          </Text>
        </Box>
      )}
    </Box>
  </Box>
);

export const CredentialsDisplay = ({
  credentials,
  scope,
}: {
  credentials: any;
  scope: any;
}) => {
  // Helper function to format credential objects for display
  const formatObject = (obj: any, indent = 0): JSX.Element[] => {
    if (!obj) return [<Text key="null">null</Text>];

    return Object.entries(obj).map(([key, value], index) => {
      const padding = " ".repeat(indent * 2);

      if (typeof value === "object" && value !== null) {
        return (
          <Box key={index} flexDirection="column">
            <Text>
              {padding}
              <Text color="cyan">{key}</Text>: {"{"}'
            </Text>
            {formatObject(value, indent + 1)}
            <Text>
              {padding}
              {"}"}
            </Text>
          </Box>
        );
      }

      return (
        <Text key={index}>
          {padding}
          <Text color="cyan">{key}</Text>:{" "}
          <Text color="green">{value?.toString() || "null"}</Text>
        </Text>
      );
    });
  };

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      marginTop={1}
      marginBottom={1}
    >
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text bold>Credentials</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column" alignItems="center">
        <Text color="gray" italic>
          Warning: Displaying sensitive data. Handle with care.
        </Text>
        <Box marginTop={1} marginBottom={1}>
          <Text color="gray" italic>
            These credentials are stored in one or more of the following places.
          </Text>
        </Box>

        <Box
          flexDirection="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box width={"32%"} alignItems="center">
            <Text color="gray" italic>
              - Your current directory (at '
              <Text color="cyan">{DEFAULT_FILE_PATH}</Text>').
            </Text>
          </Box>
          <Box width={"32%"} alignItems="center">
            <Text color="gray" italic>
              - In a location of your choosing, supplied by inputting custom
              read/write credential functions.
            </Text>
          </Box>
          <Box width={"32%"} alignItems="center">
            <Text color="gray" italic>
              - Your config directory (located at '
              <Text color="cyan">{DEFAULT_CONFIG_PATH}</Text>').
            </Text>
          </Box>
        </Box>
      </Box>

      <Box flexDirection="column" marginLeft={2}>
        {formatObject(credentials)}
      </Box>

      {scope && (
        <>
          <Box
            flexDirection="column"
            alignItems="center"
            marginTop={1}
            marginBottom={1}
          >
            <Text bold>Scope Permissions</Text>
          </Box>

          <Box flexDirection="column" marginLeft={2}>
            {Array.isArray(scope) ? (
              scope.map((permission, index) => (
                <Text key={index}>
                  <Text color="green">{figures.tick}</Text> {permission}
                </Text>
              ))
            ) : typeof scope === "object" ? (
              formatObject(scope)
            ) : (
              <Text>{scope?.toString() || "No scope defined"}</Text>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export const CredentialsStored = ({ path }: { path: string }) => {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      marginTop={1}
      marginBottom={1}
    >
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Box>
          <Text color="green" bold>
            Credentials Successfully Stored
          </Text>
        </Box>
      </Box>
      <Box>
        <Text>Your Facebook credentials have been saved at:</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="cyan" italic>
          {path}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>
          These credentials will be used as a fallback for authentication.
        </Text>
      </Box>
    </Box>
  );
};

export const CredentialsJSON = ({
  credentials,
}: {
  credentials: Record<string, any>;
}) => {
  // Format credentials entries for display
  const credentialEntries = Object.entries(credentials)
    .filter(([_, value]) => value !== undefined) // Filter out undefined values
    .map(([key, value]) => [toEnvironmentKey(key), value]) as [
    string,
    string | number | boolean | null
  ][];

  const paste = JSON.stringify(
    Object.fromEntries(credentialEntries.map(([key, value]) => [key, value])),
    null,
    2
  );
  writeToClipboard(paste);

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      marginTop={1}
      marginBottom={1}
      width={"100%"}
    >
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Box>
          <Text bold>Credentials</Text>
        </Box>
      </Box>

      {/* Always show JSON format */}
      <Box marginBottom={1}>
        <Text bold>JSON Format</Text>
      </Box>
      <Box
        flexDirection="column"
        marginLeft={2}
        marginBottom={2}
        width={"100%"}
      >
        {credentialEntries.map(([key, value], index) => (
          <Text key={`json-${key}`}>
            {'"'}
            <Text color="cyan">{key}</Text>
            {'"'}: {`"${value}"`}
            {index < credentialEntries.length - 1 ? "," : ""}
          </Text>
        ))}
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color="gray" italic>
            If your terminal isn't wide enough (likely), these values will wrap
            to the next line, and produce invalid JSON.
          </Text>
          <Text color="gray" italic>
            You can fix this by increasing your terminal width, but you'll
            probably have to manually get rid of the new lines after you paste
            the JSON.
          </Text>
        </Box>
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text color="blue" bold>
            These credentials have been copied to your clipboard.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export const CredentialsEnvironmentShell = ({
  credentials,
}: {
  credentials: Record<string, any>;
}) => {
  const platform = process.platform;
  const isWindows = platform === "win32";
  const isMac = platform === "darwin";
  const isLinux = platform === "linux";

  // Format credentials entries for display
  const credentialEntries = Object.entries(credentials)
    .filter(([_, value]) => value !== undefined) // Filter out undefined values
    .map(([key, value]) => [toEnvironmentKey(key), value]) as [
    string,
    string | number | boolean | null
  ][];

  let paste: string;
  if (isMac || isLinux) {
    paste = credentialEntries
      .map(([key, value]) => {
        return `export ${key}=${value}`;
      })
      .join("\n");
  } else if (isWindows) {
    paste = credentialEntries
      .map(([key, value]) => {
        return `set ${key}=${value}`;
      })
      .join("\n");
  } else {
    throw new Error("Unsupported platform");
  }
  writeToClipboard(paste);

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      marginTop={1}
      marginBottom={1}
      width={"100%"}
    >
      {/* Show Unix/Linux/macOS format if on those platforms */}
      {(isMac || isLinux) && (
        <>
          <Box marginBottom={1}>
            <Text bold>Unix Commands</Text>
          </Box>
          <Box flexDirection="column" marginLeft={2} marginBottom={2}>
            {credentialEntries.map(([key, value]) => (
              <Text key={`unix-${key}`}>
                export <Text color="green">{key}</Text>="{String(value)}"
              </Text>
            ))}
          </Box>
        </>
      )}

      {/* Show Windows CMD format if on Windows */}
      {isWindows && (
        <>
          <Box marginBottom={1}>
            <Text bold>CMD Commands</Text>
          </Box>
          <Box flexDirection="column" marginLeft={2} marginBottom={2}>
            {credentialEntries.map(([key, value]) => (
              <Text key={`cmd-${key}`}>
                set <Text color="green">{key}</Text>="{String(value)}"
              </Text>
            ))}
          </Box>

          <Box marginBottom={1}>
            <Text bold>PowerShell Commands</Text>
          </Box>
          <Box flexDirection="column" marginLeft={2}>
            {credentialEntries.map(([key, value]) => (
              <Text key={`ps-${key}`}>
                $env:<Text color="green">{key}</Text> = "{String(value)}"
              </Text>
            ))}
          </Box>
        </>
      )}
      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Text color="blue" bold>
          These credentials have been copied to your clipboard.
        </Text>
      </Box>
    </Box>
  );
};

export const CredentialsLoaded = ({
  credentials,
}: {
  credentials: Record<string, any>;
}) => {
  // Detect OS
  const platform = process.platform;
  const isWindows = platform === "win32";
  const isMac = platform === "darwin";
  const isLinux = platform === "linux";

  // Format credentials entries for display
  const credentialEntries = Object.entries(credentials)
    .filter(([_, value]) => value !== undefined) // Filter out undefined values
    .map(([key, value]) => [toEnvironmentKey(key), value]) as [
    string,
    string | number | boolean | null
  ][];

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      marginTop={1}
      marginBottom={1}
      width={"100%"}
    >
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Box>
          <Text bold>Credentials</Text>
        </Box>
      </Box>

      {/* Always show JSON format */}
      <Box marginBottom={1}>
        <Text bold>JSON Format</Text>
      </Box>
      <Box
        flexDirection="column"
        marginLeft={2}
        marginBottom={2}
        width={"100%"}
      >
        {credentialEntries.map(([key, value], index) => (
          <Text key={`json-${key}`}>
            {'"'}
            <Text color="cyan">{key}</Text>
            {'"'}: {`"${value}"`}
            {index < credentialEntries.length - 1 ? "," : ""}
          </Text>
        ))}
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color="gray" italic>
            If your terminal isn't wide enough (likely), these values will wrap
            to the next line, and produce invalid JSON.
          </Text>
          <Text color="gray" italic>
            You can fix this by increasing your terminal width, but you'll
            probably have to manually get rid of the new lines after you paste
            the JSON.
          </Text>
        </Box>
      </Box>

      {/* Show Unix/Linux/macOS format if on those platforms */}
      {(isMac || isLinux) && (
        <>
          <Box marginBottom={1}>
            <Text bold>Unix Commands</Text>
          </Box>
          <Box flexDirection="column" marginLeft={2} marginBottom={2}>
            {credentialEntries.map(([key, value]) => (
              <Text key={`unix-${key}`}>
                export <Text color="green">{key}</Text>="{String(value)}"
              </Text>
            ))}
          </Box>
        </>
      )}

      {/* Show Windows CMD format if on Windows */}
      {isWindows && (
        <>
          <Box marginBottom={1}>
            <Text bold>CMD Commands</Text>
          </Box>
          <Box flexDirection="column" marginLeft={2} marginBottom={2}>
            {credentialEntries.map(([key, value]) => (
              <Text key={`cmd-${key}`}>
                set <Text color="green">{key}</Text>="{String(value)}"
              </Text>
            ))}
          </Box>

          <Box marginBottom={1}>
            <Text bold>PowerShell Commands</Text>
          </Box>
          <Box flexDirection="column" marginLeft={2}>
            {credentialEntries.map(([key, value]) => (
              <Text key={`ps-${key}`}>
                $env:<Text color="green">{key}</Text> = "{String(value)}"
              </Text>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

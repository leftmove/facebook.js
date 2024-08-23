import React, { useState, useEffect } from "react";
import { render, Box, Text } from "ink";
import figures from "figures";
import type { ReactNode } from "react";

export const yellow = "\x1b[43m";
export const blue = "\x1b[44m";
export const green = "\x1b[42m";
export const white = "\x1b[47";
export const reset = "\x1b[0m";

export const Initial = (
  <Box flexDirection="column" alignItems="center" marginBottom={1}>
    <Text color="white">---------------</Text>
    <Text color="cyan">facebook.js</Text>
    <Text color="white">---------------</Text>
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
    <Text>
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

export const LoginStart = (
  <Box
    flexDirection="column"
    alignItems="center"
    marginTop={1}
    marginBottom={1}
  >
    <Box flexDirection="column" alignItems="center">
      <Box flexDirection="column" alignItems="center" marginBottom={2}>
        <Text color="yellow">Logging In</Text>
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
      <Text color="yellow">Successfully Logged In!</Text>
    </Box>
    <Box>
      <Text>You can now use all the features of the Facebook API.</Text>
    </Box>
  </Box>
);

export function centerText(text: string): string {
  const terminalWidth = process.stdout.columns;
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

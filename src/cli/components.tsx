import { render, Box, Text } from "ink";

import ora from "ora";

export const yellow = "\x1b[43m";
export const blue = "\x1b[44m";
export const green = "\x1b[42m";
export const white = "\x1b[47";
export const reset = "\x1b[0m";

export const Initial = () => {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={2}>
      <Text color="white">---------------</Text>
      <Text color="cyan">facebook.js</Text>
      <Text color="white">---------------</Text>
    </Box>
  );
};

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

export const spin = (message: string) => {
  const spinner = ora({
    text: message,
    spinner: "dots",
    color: "white",
  }).start();

  return spinner;
};

export const loginStart = () => {
  return render(
    <Box flexDirection="column" alignItems="center">
      <Initial />
      <Box flexDirection="column" alignItems="center">
        <Box flexDirection="column" alignItems="center" marginBottom={2}>
          <Text color="yellow">Logging In</Text>
        </Box>
        <Text>
          To View Your App Credentials, visit
          https://developers.facebook.com/apps and select/create your app.
        </Text>
        <Text>
          Then, copy the app ID and secret from App Settings &gt; Basic.
        </Text>
      </Box>
    </Box>
  );
};

export const loginSuccess = () => {
  return render(
    <Box flexDirection="column" alignItems="center">
      <Box marginBottom={2}>
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
  );
};

export function centerText(text: string): string {
  const terminalWidth = process.stdout.columns;
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((terminalWidth - textLength) / 2));
  return " ".repeat(padding) + text;
}

export function info(emoji: string, message: string, color = "yellow") {
  switch (emoji) {
    case "loading":
      emoji = "⌛";
      break;
    case "auth":
      emoji = "🔒";
      break;
    case "success":
      emoji = "✅";
      break;
    case "error":
      emoji = "❌";
      break;
  }
  render(
    <Box>
      <Text bold={true} color={color}>
        {emoji}
      </Text>
      <Text bold={true}> {message}</Text>
    </Box>
  );
}

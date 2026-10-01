import { Alert } from "@mui/material";

interface ErrorAlertProps { message: string | null; }

function ErrorAlert({ message }: ErrorAlertProps) {
  return message ? <Alert severity="error">{message}</Alert> : null;
}

export default ErrorAlert;

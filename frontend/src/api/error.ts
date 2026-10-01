import axios from "axios";

interface ValidationErrorItem {
  msg?: string;
}

interface BackendErrorResponse {
  detail?: string | ValidationErrorItem[];
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => item.msg)
        .filter((message): message is string => Boolean(message))
        .join(". ");
    }

    if (error.response?.status === 0 || !error.response) {
      return "Unable to reach the backend. Please make sure the FastAPI server is running.";
    }

    return `Request failed with status ${error.response.status}.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

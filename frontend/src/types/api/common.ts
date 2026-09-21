export interface FastApiValidationDetail {
  msg: string;
}

export interface FastApiErrorBody {
  detail?: string | FastApiValidationDetail[];
}

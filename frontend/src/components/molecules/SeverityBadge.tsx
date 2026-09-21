import { Badge } from "@/components/ui/badge";
import { getSeverityBadgeVariant } from "@/utils/severity";
import type { Severity } from "@/types/api/triage";

interface SeverityBadgeProps {
  severity: Severity;
  label: string;
}

export function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  return <Badge variant={getSeverityBadgeVariant(severity)}>{label}</Badge>;
}

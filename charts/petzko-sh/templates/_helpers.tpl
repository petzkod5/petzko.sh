{{/* Expand the name of the chart. */}}
{{- define "petzko-sh.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Fully qualified app name. */}}
{{- define "petzko-sh.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "petzko-sh.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels. */}}
{{- define "petzko-sh.labels" -}}
helm.sh/chart: {{ include "petzko-sh.chart" . }}
{{ include "petzko-sh.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Selector labels (frontend). */}}
{{- define "petzko-sh.selectorLabels" -}}
app.kubernetes.io/name: {{ include "petzko-sh.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Backend selector labels — a DISTINCT app name so the frontend Service
     (which selects on name+instance) never matches backend pods. */}}
{{- define "petzko-sh.backendSelectorLabels" -}}
app.kubernetes.io/name: {{ include "petzko-sh.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Collector selector labels — distinct app name (no Service fronts it). */}}
{{- define "petzko-sh.collectorSelectorLabels" -}}
app.kubernetes.io/name: {{ include "petzko-sh.name" . }}-collector
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SectionErrorBoundary:${this.props.sectionName}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Card className="rounded-2xl border-dashed border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {this.props.sectionName ? `Error en ${this.props.sectionName}` : "Algo salió mal"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No se pudieron cargar estos datos. Intenta de nuevo.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl"
              onClick={this.handleReset}
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

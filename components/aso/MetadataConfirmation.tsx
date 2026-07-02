"use client";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { SmartphoneIcon, GlobeIcon } from "lucide-react";

interface MetadataResult {
  appId: string;
  storefront: string;
  originalUrl: string;
}

export function MetadataConfirmation({ result }: { result: MetadataResult }) {
  if (!result || !result.appId) return null;

  return (
    <Card className="w-64 bg-card shadow-sm border mt-2">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-md">
            <SmartphoneIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm line-clamp-1">App Detected</p>
            <p className="text-xs text-muted-foreground break-all line-clamp-1">{result.appId}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex gap-1 text-xs">
            <GlobeIcon className="w-3 h-3" />
            {result.storefront}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

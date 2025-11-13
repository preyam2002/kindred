"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShareButtons } from "./share-buttons";
import { Sparkles, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/share-utils";

interface ChallengeFriendProps {
  username: string;
}

export function ChallengeFriend({ username }: ChallengeFriendProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const challengeUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/u/${username}`;

  const handleCopy = async () => {
    const success = await copyToClipboard(challengeUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareConfig = {
    type: "challenge" as const,
    url: challengeUrl,
    user1: username,
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            Challenge Your Friends
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Think your friends know you? Challenge them to check their
            compatibility with your taste!
          </p>

          {!showShare ? (
            <Button
              onClick={() => setShowShare(true)}
              className="gap-2"
              size="sm"
            >
              <Sparkles className="w-4 h-4" />
              Create Challenge
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Challenge URL */}
              <div className="flex gap-2">
                <Input
                  value={challengeUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Share Buttons */}
              <ShareButtons config={shareConfig} showLabels={false} />

              <p className="text-xs text-muted-foreground">
                Share this link with your friends. When they check your
                compatibility, you'll see the results!
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

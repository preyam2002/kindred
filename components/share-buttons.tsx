"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Link as LinkIcon,
  Share2,
  Check,
} from "lucide-react";
import {
  ShareConfig,
  getTwitterShareUrl,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getWhatsAppShareUrl,
  copyToClipboard,
  trackShare,
  getShareUrl,
} from "@/lib/share-utils";

interface ShareButtonsProps {
  config: ShareConfig;
  compact?: boolean;
  showLabels?: boolean;
}

export function ShareButtons({
  config,
  compact = false,
  showLabels = true,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (platform: string, url: string) => {
    setIsSharing(true);

    try {
      // Track the share
      const { referralCode, shareId } = await trackShare(
        config.type,
        platform,
        {
          user1: config.user1,
          user2: config.user2,
          score: config.score,
        }
      );

      // Add tracking params to the share URL
      const trackedUrl = getShareUrl(config.url, referralCode, shareId);

      // Update the URL with tracking params
      if (platform === "twitter") {
        url = getTwitterShareUrl({ ...config, url: trackedUrl });
      } else if (platform === "facebook") {
        url = getFacebookShareUrl({ ...config, url: trackedUrl });
      } else if (platform === "linkedin") {
        url = getLinkedInShareUrl({ ...config, url: trackedUrl });
      } else if (platform === "whatsapp") {
        url = getWhatsAppShareUrl({ ...config, url: trackedUrl });
      }

      // Open share dialog
      window.open(url, "_blank", "width=550,height=420");
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Track the share
      const { referralCode, shareId } = await trackShare(
        config.type,
        "copy_link",
        {
          user1: config.user1,
          user2: config.user2,
          score: config.score,
        }
      );

      // Get URL with tracking params
      const trackedUrl = getShareUrl(config.url, referralCode, shareId);

      const success = await copyToClipboard(trackedUrl);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const shareButtons = [
    {
      name: "Twitter",
      icon: Twitter,
      platform: "twitter",
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
      getUrl: getTwitterShareUrl,
    },
    {
      name: "Facebook",
      icon: Facebook,
      platform: "facebook",
      color: "hover:bg-[#1877F2]/10 hover:text-[#1877F2]",
      getUrl: getFacebookShareUrl,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      platform: "linkedin",
      color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
      getUrl: getLinkedInShareUrl,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      platform: "whatsapp",
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366]",
      getUrl: getWhatsAppShareUrl,
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          disabled={copied}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showLabels && (
        <h3 className="text-sm font-medium text-muted-foreground">
          Share this match
        </h3>
      )}

      <div className="flex flex-wrap gap-2">
        {shareButtons.map((button) => {
          const Icon = button.icon;
          return (
            <Button
              key={button.platform}
              variant="outline"
              size={compact ? "icon-sm" : "default"}
              onClick={() => handleShare(button.platform, button.getUrl(config))}
              disabled={isSharing}
              className={`gap-2 ${button.color}`}
              title={`Share on ${button.name}`}
            >
              <Icon className="w-4 h-4" />
              {!compact && <span>{button.name}</span>}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size={compact ? "icon-sm" : "default"}
          onClick={handleCopyLink}
          disabled={copied}
          className="gap-2"
          title="Copy link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              {!compact && <span>Copied!</span>}
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              {!compact && <span>Copy Link</span>}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

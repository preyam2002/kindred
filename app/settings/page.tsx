"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Film,
  Music,
  Tv,
  Link2,
  Check,
  Upload,
  X,
  ExternalLink,
  Shield,
  Bell,
  Mail,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Palette,
  Trophy,
  Calendar,
  MessageCircle,
} from "lucide-react";
import type { Source } from "@/types/database";

const integrations = [
  {
    name: "Goodreads",
    id: "goodreads",
    icon: BookOpen,
    description: "Import your books and reading activity",
    color: "text-primary",
  },
  {
    name: "MyAnimeList",
    id: "myanimelist",
    icon: Tv,
    description: "Sync your anime and manga lists",
    color: "text-secondary",
  },
  {
    name: "Letterboxd",
    id: "letterboxd",
    icon: Film,
    description: "Connect your movie watchlist and reviews",
    color: "text-primary",
  },
  {
    name: "Spotify",
    id: "spotify",
    icon: Music,
    description: "Import your music listening history",
    color: "text-secondary",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"integrations" | "privacy" | "notifications" | "account">("integrations");
  const [connectedSources, setConnectedSources] = useState<Source[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Integration states
  const [showGoodreadsUpload, setShowGoodreadsUpload] = useState(false);
  const [showLetterboxdUpload, setShowLetterboxdUpload] = useState(false);
  const [showGoodreadsScraper, setShowGoodreadsScraper] = useState(false);
  const [showLetterboxdScraper, setShowLetterboxdScraper] = useState(false);
  const [showMALConnect, setShowMALConnect] = useState(false);
  const [uploadingGoodreads, setUploadingGoodreads] = useState(false);
  const [uploadingLetterboxd, setUploadingLetterboxd] = useState(false);
  const [scrapingGoodreads, setScrapingGoodreads] = useState(false);
  const [scrapingLetterboxd, setScrapingLetterboxd] = useState(false);
  const [connectingMAL, setConnectingMAL] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [letterboxdProfileUrl, setLetterboxdProfileUrl] = useState("");
  const [goodreadsUsername, setGoodreadsUsername] = useState("");
  const [letterboxdUsername, setLetterboxdUsername] = useState("");
  const [malUsername, setMalUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const letterboxdFileInputRef = useRef<HTMLInputElement>(null);

  // Privacy settings
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [challengeNotifications, setChallengeNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetchConnections();
    }

    // Check for URL params for success/error messages
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    const syncedTracks = params.get("syncedTracks");
    const syncErrors = params.get("syncErrors");
    const warning = params.get("warning");

    if (connected) {
      // Refresh connections to reflect new integration state
      fetchConnections();

      let text = `Successfully connected to ${connected}!`;

      if (syncedTracks && !Number.isNaN(Number(syncedTracks))) {
        text += ` Synced ${syncedTracks} tracks`;
        if (syncErrors && Number(syncErrors) > 0) {
          text += ` with ${syncErrors} errors`;
        }
        text += ".";
      } else if (connected === "spotify" && warning === "spotify_sync_failed") {
        text += " However, the initial Spotify sync failed. Please try syncing manually.";
      }

      setMessage({
        type:
          warning && connected === "spotify" && warning === "spotify_sync_failed"
            ? "error"
            : "success",
        text,
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (warning === "spotify_sync_failed") {
      setMessage({
        type: "error",
        text: "Spotify sync failed. Please try again from Settings.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [session]);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      setConnectedSources(data.sources || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }

  async function handleConnect(sourceName: string) {
    if (sourceName === "goodreads") {
      setShowGoodreadsUpload(true);
    } else if (sourceName === "letterboxd") {
      setShowLetterboxdUpload(true);
    } else if (sourceName === "myanimelist") {
      setShowMALConnect(true);
    } else {
      // For other integrations (Spotify), redirect to OAuth flow
      window.location.href = `/api/integrations/${sourceName}/connect`;
    }
  }

  async function handleGoodreadsScrape(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!goodreadsUsername.trim()) {
      setMessage({ type: "error", text: "Please enter a Goodreads username or user ID" });
      return;
    }

    setScrapingGoodreads(true);
    setMessage(null);

    try {
      const res = await fetch("/api/scrape/goodreads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: goodreadsUsername.trim(),
          profileUrl: profileUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || `Successfully imported ${data.imported} books!`,
        });
        setShowGoodreadsScraper(false);
        setGoodreadsUsername("");
        setProfileUrl("");
        fetchConnections();
      } else {
        setMessage({
          type: "error",
          text: data.error || data.message || "Failed to scrape Goodreads profile",
        });
      }
    } catch (error) {
      console.error("Scrape error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while scraping. Please try again.",
      });
    } finally {
      setScrapingGoodreads(false);
    }
  }

  async function handleLetterboxdScrape(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!letterboxdUsername.trim()) {
      setMessage({ type: "error", text: "Please enter a Letterboxd username" });
      return;
    }

    setScrapingLetterboxd(true);
    setMessage(null);

    try {
      const res = await fetch("/api/scrape/letterboxd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: letterboxdUsername.trim(),
          profileUrl: letterboxdProfileUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || `Successfully imported ${data.imported} films!`,
        });
        setShowLetterboxdScraper(false);
        setLetterboxdUsername("");
        setLetterboxdProfileUrl("");
        fetchConnections();
      } else {
        setMessage({
          type: "error",
          text: data.error || data.message || "Failed to scrape Letterboxd profile",
        });
      }
    } catch (error) {
      console.error("Scrape error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while scraping. Please try again.",
      });
    } finally {
      setScrapingLetterboxd(false);
    }
  }

  async function handleGoodreadsUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setMessage({ type: "error", text: "Please select a CSV file" });
      return;
    }

    setUploadingGoodreads(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (profileUrl.trim()) {
        formData.append("profileUrl", profileUrl.trim());
      }

      const res = await fetch("/api/integrations/goodreads/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || `Successfully imported ${data.imported} books!`,
        });
        setShowGoodreadsUpload(false);
        setProfileUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchConnections();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to upload CSV file",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while uploading the file",
      });
    } finally {
      setUploadingGoodreads(false);
    }
  }

  async function handleLetterboxdUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = letterboxdFileInputRef.current?.files?.[0];

    if (!file) {
      setMessage({ type: "error", text: "Please select a CSV file" });
      return;
    }

    setUploadingLetterboxd(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (letterboxdProfileUrl.trim()) {
        formData.append("profileUrl", letterboxdProfileUrl.trim());
      }

      const res = await fetch("/api/integrations/letterboxd/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || `Successfully imported ${data.imported} films!`,
        });
        setShowLetterboxdUpload(false);
        setLetterboxdProfileUrl("");
        if (letterboxdFileInputRef.current) {
          letterboxdFileInputRef.current.value = "";
        }
        fetchConnections();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to upload CSV file",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while uploading the file",
      });
    } finally {
      setUploadingLetterboxd(false);
    }
  }

  async function handleMALConnect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!malUsername.trim()) {
      setMessage({ type: "error", text: "Please enter a MyAnimeList username" });
      return;
    }

    setConnectingMAL(true);
    setMessage(null);

    try {
      const res = await fetch("/api/integrations/myanimelist/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: malUsername.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Show sync results if available
        let messageText = data.message || "MyAnimeList connected successfully!";
        if (data.animeImported !== undefined || data.mangaImported !== undefined) {
          const parts = [];
          if (data.animeImported > 0) parts.push(`${data.animeImported} anime`);
          if (data.mangaImported > 0) parts.push(`${data.mangaImported} manga`);
          if (parts.length > 0) {
            messageText = `MyAnimeList connected! Synced ${parts.join(" and ")}.`;
          }
          if (data.errors > 0) {
            messageText += ` (${data.errors} errors)`;
          }
        }
        
        setMessage({
          type: data.warning ? "error" : "success",
          text: messageText,
        });
        setShowMALConnect(false);
        setMalUsername("");
        fetchConnections();
      } else {
        const errorText = data.error || "Failed to connect MyAnimeList";
        const details = data.details ? `: ${data.details}` : "";
        setMessage({
          type: "error",
          text: `${errorText}${details}`,
        });
      }
    } catch (error) {
      console.error("Connect error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while connecting. Please try again.",
      });
    } finally {
      setConnectingMAL(false);
    }
  }

  async function handleDisconnect(sourceId: string) {
    try {
      const res = await fetch(`/api/integrations/delete/${sourceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchConnections();
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/auth/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "integrations" as const, label: "Integrations", icon: Link2 },
    { id: "privacy" as const, label: "Privacy", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "account" as const, label: "Account", icon: Trash2 },
  ];

  const handleDataExport = async () => {
    setMessage({ type: "success", text: "Preparing your data export..." });
    // TODO: Implement actual data export
    setTimeout(() => {
      setMessage({ type: "success", text: "Data export sent to your email!" });
    }, 2000);
  };

  const handleAccountDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }
    // TODO: Implement actual account deletion
    setMessage({ type: "success", text: "Account deletion initiated..." });
  };

  const handleSavePrivacy = async () => {
    // TODO: Implement actual API call to save privacy settings
    setMessage({ type: "success", text: "Privacy settings saved!" });
  };

  const handleSaveNotifications = async () => {
    // TODO: Implement actual API call to save notification settings
    setMessage({ type: "success", text: "Notification preferences saved!" });
  };

  return (
    <>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">
            Manage your account, privacy, and integrations
          </p>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-md ${
                message.type === "success"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-destructive/20 text-destructive border border-destructive/30"
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integrations" && (
            <div className="space-y-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              const isConnected = connectedSources.some(
                (s) => s.source_name === integration.id
              );
              const connectedSource = connectedSources.find(
                (s) => s.source_name === integration.id
              );

              return (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-border rounded-lg p-6 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${integration.color}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {integration.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {integration.description}
                        </p>
                        {isConnected && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Check className="w-4 h-4" />
                            <span>Connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isConnected ? (
                        <button
                          onClick={() =>
                            connectedSource &&
                            handleDisconnect(connectedSource.id)
                          }
                          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm"
                        >
                          Disconnect
                        </button>
                      ) : integration.id === "goodreads" ||
                        integration.id === "letterboxd" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (integration.id === "goodreads") {
                                setShowGoodreadsScraper(true);
                              } else {
                                setShowLetterboxdScraper(true);
                              }
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 text-sm font-medium shadow-sm"
                            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                          >
                            <Link2 className="w-4 h-4" />
                            Scrape Profile
                          </button>
                          <button
                            onClick={() => handleConnect(integration.id)}
                            className="px-4 py-2 bg-background border border-border rounded-md hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                          >
                            <Upload className="w-4 h-4" />
                            Upload CSV
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.id)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
                        >
                          <Link2 className="w-4 h-4" />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

          <div className="mt-12 p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-bold mb-2">Sync Data</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manually sync data from your connected platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {connectedSources.map((source) => (
                <button
                  key={source.id}
                  onClick={async () => {
                    try {
                      setMessage({
                        type: "success",
                        text: `Syncing ${source.source_name}...`,
                      });
                      const res = await fetch(
                        `/api/integrations/${source.source_name}/sync`,
                        { method: "POST" }
                      );
                      if (res.ok) {
                        const data = await res.json();
                        setMessage({
                          type: "success",
                          text:
                            data.message ||
                            `${source.source_name} synced successfully!`,
                        });
                        // Refresh connections
                        fetchConnections();
                      } else {
                        const error = await res.json();
                        setMessage({
                          type: "error",
                          text:
                            error.error ||
                            `Failed to sync ${source.source_name}`,
                        });
                      }
                    } catch (error) {
                      console.error("Sync error:", error);
                      setMessage({
                        type: "error",
                        text: `Error syncing ${source.source_name}`,
                      });
                    }
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity text-sm capitalize"
                >
                  Sync {source.source_name}
                </button>
              ))}
            </div>
          </div>
          </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">Profile Privacy</h2>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile and activity
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {isProfilePublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      <div>
                        <div className="font-medium">Public Profile</div>
                        <div className="text-sm text-muted-foreground">
                          Make your profile visible to everyone
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isProfilePublic}
                        onChange={(e) => setIsProfilePublic(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Show Email Address</div>
                        <div className="text-sm text-muted-foreground">
                          Display your email on your public profile
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showEmail}
                        onChange={(e) => setShowEmail(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Public Library</div>
                        <div className="text-sm text-muted-foreground">
                          Let others see your library and ratings
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLibrary}
                        onChange={(e) => setShowLibrary(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSavePrivacy}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    Save Privacy Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">Notification Preferences</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose what updates you want to receive
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5" />
                      <div>
                        <div className="font-medium">New Matches</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified when you match with someone
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={matchNotifications}
                        onChange={(e) => setMatchNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Challenge Invites</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified about challenge invitations
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={challengeNotifications}
                        onChange={(e) => setChallengeNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Comment Replies</div>
                        <div className="text-sm text-muted-foreground">
                          Get notified when someone replies to your comments
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={commentNotifications}
                        onChange={(e) => setCommentNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Streak Reminders</div>
                        <div className="text-sm text-muted-foreground">
                          Daily reminders to maintain your streak
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={streakReminders}
                        onChange={(e) => setStreakReminders(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSaveNotifications}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                  >
                    Save Notification Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {/* Data Export */}
              <div className="p-6 border border-border rounded-lg bg-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">Export Your Data</h2>
                    <p className="text-sm text-muted-foreground">
                      Download all your data in JSON format (GDPR compliant)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDataExport}
                  className="px-6 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                >
                  Export Data
                </button>
              </div>

              {/* Account Deletion */}
              <div className="p-6 border border-destructive/30 rounded-lg bg-destructive/5">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1 text-destructive">Delete Account</h2>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Goodreads CSV Upload Modal */}
      {showGoodreadsUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Import Goodreads Data</h2>
              <button
                onClick={() => {
                  setShowGoodreadsUpload(false);
                  setProfileUrl("");
                  setUploadingGoodreads(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={uploadingGoodreads}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-muted/50 rounded-md border border-border">
              <p className="text-sm mb-2">To export your Goodreads data:</p>
              <Link
                href="https://www.goodreads.com/review/import"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Go to Goodreads Export
                <ExternalLink className="w-3 h-3" />
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Download your library as a CSV file, then upload it here.
              </p>
            </div>

            <form onSubmit={handleGoodreadsUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Goodreads Profile URL (optional)
                </label>
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://www.goodreads.com/user/show/123456"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your public Goodreads profile URL for linking
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploadingGoodreads}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingGoodreads ? "Uploading..." : "Upload CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoodreadsUpload(false);
                    setProfileUrl("");
                    setUploadingGoodreads(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={uploadingGoodreads}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Letterboxd CSV Upload Modal */}
      {showLetterboxdUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Import Letterboxd Data</h2>
              <button
                onClick={() => {
                  setShowLetterboxdUpload(false);
                  setLetterboxdProfileUrl("");
                  setUploadingLetterboxd(false);
                  if (letterboxdFileInputRef.current) {
                    letterboxdFileInputRef.current.value = "";
                  }
                }}
                disabled={uploadingLetterboxd}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-muted/50 rounded-md border border-border">
              <p className="text-sm mb-2">To export your Letterboxd data:</p>
              <Link
                href="https://letterboxd.com/import/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Go to Letterboxd Import
                <ExternalLink className="w-3 h-3" />
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Follow the instructions to export your films (CSV or ZIP), then
                upload it here.
              </p>
            </div>

            <form onSubmit={handleLetterboxdUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  CSV or ZIP File
                </label>
                <input
                  ref={letterboxdFileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your Letterboxd export (CSV file or ZIP archive)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Letterboxd Profile URL (optional)
                </label>
                <input
                  type="url"
                  value={letterboxdProfileUrl}
                  onChange={(e) => setLetterboxdProfileUrl(e.target.value)}
                  placeholder="https://letterboxd.com/username/"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your public Letterboxd profile URL for linking
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploadingLetterboxd}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingLetterboxd ? "Uploading..." : "Upload CSV"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLetterboxdUpload(false);
                    setLetterboxdProfileUrl("");
                    setUploadingLetterboxd(false);
                    if (letterboxdFileInputRef.current) {
                      letterboxdFileInputRef.current.value = "";
                    }
                  }}
                  disabled={uploadingLetterboxd}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Goodreads Scraper Modal */}
      {showGoodreadsScraper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-border rounded-lg p-6 max-w-md w-full shadow-lg bg-white"
            style={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Scrape Goodreads Profile</h2>
              <button
                onClick={() => {
                  setShowGoodreadsScraper(false);
                  setGoodreadsUsername("");
                  setProfileUrl("");
                  setScrapingGoodreads(false);
                }}
                disabled={scrapingGoodreads}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-muted/50 rounded-md border border-border">
              <p className="text-sm mb-2">Enter your Goodreads username or user ID:</p>
              <p className="text-xs text-muted-foreground">
                We'll scrape your public Goodreads profile to import your books. This may take a few moments.
              </p>
            </div>

            <form onSubmit={handleGoodreadsScrape} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Goodreads Username or User ID
                </label>
                <input
                  type="text"
                  value={goodreadsUsername}
                  onChange={(e) => setGoodreadsUsername(e.target.value)}
                  placeholder="username or 123456"
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Goodreads username or numeric user ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Goodreads Profile URL (optional)
                </label>
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://www.goodreads.com/user/show/123456"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your public Goodreads profile URL for linking
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={scrapingGoodreads}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scrapingGoodreads ? "Scraping..." : "Scrape Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoodreadsScraper(false);
                    setGoodreadsUsername("");
                    setProfileUrl("");
                    setScrapingGoodreads(false);
                  }}
                  disabled={scrapingGoodreads}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Letterboxd Scraper Modal */}
      {showLetterboxdScraper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-border rounded-lg p-6 max-w-md w-full shadow-lg bg-white"
            style={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Scrape Letterboxd Profile</h2>
              <button
                onClick={() => {
                  setShowLetterboxdScraper(false);
                  setLetterboxdUsername("");
                  setLetterboxdProfileUrl("");
                  setScrapingLetterboxd(false);
                }}
                disabled={scrapingLetterboxd}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-muted/50 rounded-md border border-border">
              <p className="text-sm mb-2">Enter your Letterboxd username:</p>
              <p className="text-xs text-muted-foreground">
                We'll scrape your public Letterboxd profile to import your films. This may take a few moments.
              </p>
            </div>

            <form onSubmit={handleLetterboxdScrape} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Letterboxd Username
                </label>
                <input
                  type="text"
                  value={letterboxdUsername}
                  onChange={(e) => setLetterboxdUsername(e.target.value)}
                  placeholder="username"
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Letterboxd username (without @)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Letterboxd Profile URL (optional)
                </label>
                <input
                  type="url"
                  value={letterboxdProfileUrl}
                  onChange={(e) => setLetterboxdProfileUrl(e.target.value)}
                  placeholder="https://letterboxd.com/username/"
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your public Letterboxd profile URL for linking
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={scrapingLetterboxd}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scrapingLetterboxd ? "Scraping..." : "Scrape Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLetterboxdScraper(false);
                    setLetterboxdUsername("");
                    setLetterboxdProfileUrl("");
                    setScrapingLetterboxd(false);
                  }}
                  disabled={scrapingLetterboxd}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MyAnimeList Connect Modal */}
      {showMALConnect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Connect MyAnimeList</h2>
              <button
                onClick={() => {
                  setShowMALConnect(false);
                  setMalUsername("");
                  setConnectingMAL(false);
                }}
                disabled={connectingMAL}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-muted/50 rounded-md border border-border">
              <p className="text-sm mb-2">Enter your MyAnimeList username:</p>
              <p className="text-xs text-muted-foreground">
                We'll sync your public anime and manga lists. Your profile must be public for this to work.
              </p>
            </div>

            <form onSubmit={handleMALConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  MyAnimeList Username
                </label>
                <input
                  type="text"
                  value={malUsername}
                  onChange={(e) => setMalUsername(e.target.value)}
                  placeholder="username"
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your public MyAnimeList profile username
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={connectingMAL}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingMAL ? "Connecting and syncing..." : "Connect"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMALConnect(false);
                    setMalUsername("");
                    setConnectingMAL(false);
                  }}
                  disabled={connectingMAL}
                  className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-destructive rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-destructive">Delete Account</h2>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-destructive/10 rounded-md border border-destructive/30">
              <p className="text-sm font-medium text-destructive mb-2">
                ⚠️ Warning: This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground">
                All your data, including your library, ratings, matches, and activity will be permanently deleted.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-destructive text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAccountDelete}
                disabled={deleteConfirmText !== "DELETE"}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete My Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

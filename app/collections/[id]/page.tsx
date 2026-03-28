"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Globe,
  Lock,
  Users,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { Collection, CollectionItem, MediaItem } from "@/types/database";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";

interface CollectionItemWithMedia extends CollectionItem {
  media: MediaItem | null;
}

interface SearchResult {
  id: string;
  title: string;
  type: string;
  poster_url?: string;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItemWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (params.id) fetchCollection();
  }, [params.id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/collections/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection);
        setItems(data.items || []);
      } else {
        setError("Failed to load collection");
      }
    } catch {
      setError("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    try {
      const res = await fetch(`/api/collections/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/collections");
    } catch { /* handled by UI */ }
  };

  if (loading) return <LoadingSpinner message="Loading collection..." fullScreen />;
  if (error || !collection) {
    return (
      <ErrorMessage
        title="Failed to load collection"
        message={error || "Collection not found"}
        onRetry={fetchCollection}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/collections" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Collections
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{collection.title}</h1>
                {collection.is_public ? <Globe className="w-5 h-5 text-muted-foreground" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                {collection.is_collaborative && <Users className="w-5 h-5 text-muted-foreground" />}
              </div>
              {collection.description && <p className="text-muted-foreground mb-4">{collection.description}</p>}
              <p className="text-sm text-muted-foreground">{items.length} items</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowEditModal(true)} className="p-2 border border-border rounded-lg hover:bg-accent transition-colors" aria-label="Edit collection">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className="p-2 border border-destructive/30 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" aria-label="Delete collection">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Add Item Button */}
        <div className="mb-6">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6">Start adding items to your collection</p>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              <Plus className="w-5 h-5" /> Add First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <CollectionItemCard key={item.id} item={item} collectionId={params.id as string} onRemove={fetchCollection} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && collection && (
          <EditCollectionModal
            collection={collection}
            onClose={() => setShowEditModal(false)}
            onSave={() => { setShowEditModal(false); fetchCollection(); }}
          />
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal
            collectionId={params.id as string}
            onClose={() => setShowAddModal(false)}
            onAdd={() => { setShowAddModal(false); fetchCollection(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditCollectionModal({ collection, onClose, onSave }: {
  collection: Collection;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(collection.title);
  const [description, setDescription] = useState(collection.description || "");
  const [isPublic, setIsPublic] = useState(collection.is_public);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), is_public: isPublic }),
      });
      if (res.ok) onSave();
    } catch { /* handled by UI */ }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Collection</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background" maxLength={100} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background" rows={3} maxLength={500} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="rounded" />
            <span className="text-sm">{isPublic ? "Public" : "Private"}</span>
            {isPublic ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-md hover:bg-accent">Cancel</button>
            <button onClick={handleSave} disabled={saving || !title.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddItemModal({ collectionId, onClose, onAdd }: {
  collectionId: string;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=media`);
        if (res.ok) {
          const data = await res.json();
          const media = data.results?.media || data.media || [];
          setResults(media.slice(0, 20));
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (item: SearchResult) => {
    setAdding(item.id);
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_type: item.type, media_id: item.id }),
      });
      if (res.ok) onAdd();
    } catch { /* ignore */ }
    setAdding(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Item</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media..." className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background" autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {searching && <p className="text-center text-muted-foreground py-4">Searching...</p>}
          {!searching && query.length >= 2 && results.length === 0 && <p className="text-center text-muted-foreground py-4">No results found</p>}
          {results.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="w-10 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                {item.poster_url && <img src={item.poster_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
              </div>
              <button onClick={() => handleAdd(item)} disabled={adding === item.id} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
                {adding === item.id ? "Adding..." : "Add"}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CollectionItemCard({ item, collectionId, onRemove }: {
  item: CollectionItemWithMedia;
  collectionId: string;
  onRemove: () => void;
}) {
  const handleRemove = async () => {
    if (!confirm("Remove this item from the collection?")) return;
    try {
      await fetch(`/api/collections/${collectionId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });
      onRemove();
    } catch { /* ignore */ }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="group relative rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all">
      <div className="aspect-[2/3] bg-muted relative overflow-hidden">
        {item.media?.poster_url ? (
          <img src={item.media.poster_url} alt={item.media.title || "Media item"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button onClick={handleRemove} className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-2 bg-card">
        <p className="text-sm font-medium line-clamp-2">{item.media?.title || "Untitled"}</p>
        {item.notes && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.notes}</p>}
      </div>
    </motion.div>
  );
}

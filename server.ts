import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Firebase Initialization
let db: FirebaseFirestore.Firestore | null = null;

function getDb() {
  if (!db) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firebase environment variables are missing. CRUD operations will fail.");
      return null;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    db = admin.firestore();
  }
  return db;
}

// API Routes
app.get("/api/songs", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const search = req.query.search as string;
  const tagId = req.query.tagId as string;
  const sortBy = req.query.sortBy as string; // 'title', 'newest', 'joyful', 'solemn', 'english', 'tagalog'
  
  try {
    let query = firestore.collection("songs") as admin.firestore.Query;

    const snapshot = await query.get();
    let songs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
      } as any;
    });

    // Populate tags for filtering/sorting
    const tagsSnapshot = await firestore.collection("tags").get();
    const allTags = tagsSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as any);

    songs = songs.map(song => ({
      ...song,
      tags: (song.tagIds || []).map((id: string) => allTags[id]).filter(Boolean)
    }));

    // Client-side filtering
    if (search) {
      const s = search.toLowerCase();
      songs = songs.filter(song => 
        song.title?.toLowerCase().includes(s) || 
        song.artist?.toLowerCase().includes(s) ||
        song.lyrics?.toLowerCase().includes(s) || 
        song.chords?.toLowerCase().includes(s) ||
        song.tags?.some((t: any) => t.name?.toLowerCase().includes(s))
      );
    }

    if (tagId) {
      songs = songs.filter(song => song.tagIds?.includes(tagId));
    }

    // Sorting logic
    // Default: Sort by title
    songs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
});

app.get("/api/songs/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  try {
    const doc = await firestore.collection("songs").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Song not found" });
    }

    const song = doc.data();
    const songWithId = {
      id: doc.id,
      ...song,
      created_at: song.created_at?.toDate?.()?.toISOString() || song.created_at,
      updated_at: song.updated_at?.toDate?.()?.toISOString() || song.updated_at
    } as any;

    // Populate tags
    const tagsSnapshot = await firestore.collection("tags").get();
    const allTags = tagsSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as any);

    res.json({
      ...songWithId,
      tags: (songWithId.tagIds || []).map((id: string) => allTags[id]).filter(Boolean)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch song" });
  }
});

app.post("/api/songs", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { title, artist, lyrics, chords, tags, video_url } = req.body;
  
  try {
    const docRef = await firestore.collection("songs").add({
      title,
      artist: artist || "",
      lyrics: lyrics || "",
      chords: chords || "",
      tagIds: tags || [],
      video_url: video_url || "",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create song" });
  }
});

app.put("/api/songs/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  const { title, artist, lyrics, chords, tags, video_url } = req.body;
  
  try {
    await firestore.collection("songs").doc(id).update({
      title,
      artist: artist || "",
      lyrics: lyrics || "",
      chords: chords || "",
      tagIds: tags || [],
      video_url: video_url || "",
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update song" });
  }
});

app.delete("/api/songs/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  try {
    await firestore.collection("songs").doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete song" });
  }
});

app.get("/api/tags", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  try {
    const snapshot = await firestore.collection("tags").orderBy("name").get();
    let tags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    // Ensure default tags exist and remove duplicates
    const defaultTags = [
      { name: "Joyful", color: "bg-yellow-100 text-yellow-800" },
      { name: "Solemn", color: "bg-indigo-100 text-indigo-800" },
      { name: "English", color: "bg-blue-100 text-blue-800" },
      { name: "Tagalog", color: "bg-red-100 text-red-800" }
    ];

    let changed = false;
    
    // Check for duplicates and remove them
    const seenNames = new Set();
    const uniqueTags = [];
    for (const tag of tags) {
      if (seenNames.has(tag.name)) {
        await firestore.collection("tags").doc(tag.id).delete();
        changed = true;
      } else {
        seenNames.add(tag.name);
        uniqueTags.push(tag);
      }
    }
    tags = uniqueTags;

    for (const defTag of defaultTags) {
      if (!tags.some((t: any) => t.name === defTag.name)) {
        const docRef = await firestore.collection("tags").add(defTag);
        tags.push({ id: docRef.id, ...defTag });
        changed = true;
      }
    }

    if (changed) {
      tags.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

app.post("/api/tags", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { name, color } = req.body;
  try {
    const docRef = await firestore.collection("tags").add({
      name,
      color: color || "bg-gray-100 text-gray-800"
    });
    res.status(201).json({ id: docRef.id, name, color });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create tag" });
  }
});

app.delete("/api/tags/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  try {
    await firestore.collection("tags").doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

// --- Roles API ---
app.get("/api/roles", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  try {
    const snapshot = await firestore.collection("roles").orderBy("name").get();
    const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

app.post("/api/roles", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { name, color } = req.body;
  try {
    const docRef = await firestore.collection("roles").add({
      name,
      color: color || "bg-gray-100 text-gray-800"
    });
    res.status(201).json({ id: docRef.id, name, color });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create role" });
  }
});

app.delete("/api/roles/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  try {
    await firestore.collection("roles").doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete role" });
  }
});

// --- Members API ---
app.get("/api/members", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  try {
    const snapshot = await firestore.collection("members").orderBy("first_name").get();
    let members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    // Populate roles
    const rolesSnapshot = await firestore.collection("roles").get();
    const allRoles = rolesSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as any);

    members = members.map(m => ({
      ...m,
      roles: (m.roleIds || []).map((id: string) => allRoles[id]).filter(Boolean)
    }));

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

app.post("/api/members", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { first_name, last_name, nickname, phone, roles } = req.body;
  try {
    const docRef = await firestore.collection("members").add({
      first_name,
      last_name,
      nickname: nickname || "",
      phone: phone || "",
      roleIds: roles || [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create member" });
  }
});

app.put("/api/members/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  const { first_name, last_name, nickname, phone, roles } = req.body;
  
  try {
    await firestore.collection("members").doc(id).update({
      first_name,
      last_name,
      nickname: nickname || "",
      phone: phone || "",
      roleIds: roles || [],
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update member" });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  try {
    await firestore.collection("members").doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

// --- Schedules API ---
app.get("/api/schedules", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  try {
    const snapshot = await firestore.collection("schedules").orderBy("date").get();
    let schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    // Populate assignments with member data
    const membersSnapshot = await firestore.collection("members").get();
    const allMembers = membersSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = { id: doc.id, ...doc.data() };
      return acc;
    }, {} as any);

    schedules = schedules.map(s => ({
      ...s,
      assignments: (s.assignments || []).map((a: any) => ({
        ...a,
        member: allMembers[a.member_id]
      }))
    }));
    
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
});

app.post("/api/schedules", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { date, title, assignments } = req.body;
  try {
    const docRef = await firestore.collection("schedules").add({
      date,
      title,
      assignments: assignments || [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

app.put("/api/schedules/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  const { date, title, assignments } = req.body;
  
  try {
    await firestore.collection("schedules").doc(id).update({
      date,
      title,
      assignments: assignments || [],
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

app.delete("/api/schedules/:id", async (req, res) => {
  const firestore = getDb();
  if (!firestore) return res.status(500).json({ error: "Firebase not configured" });

  const { id } = req.params;
  try {
    await firestore.collection("schedules").doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

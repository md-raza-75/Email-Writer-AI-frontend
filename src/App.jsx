// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Switch,
  Grid,
  Divider,
  Chip,
  Tooltip,
  InputAdornment
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import StarBorder from "@mui/icons-material/StarBorder";
import Star from "@mui/icons-material/Star";
import DownloadIcon from "@mui/icons-material/Download";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import './App.css';
import axios from "axios";

/*
  Full-featured Email Assistant App.jsx
  - Save history (localStorage)
  - Favorite replies
  - Templates
  - Subject generator
  - Download TXT, Print-as-PDF
  - Voice to Text (Web Speech API)
  - Profile section for auto-fill
  - Simple smart transform (formal/casual)
*/

const TEMPLATES = [
  { id: "thankyou", title: "Thank You (Short)", content: "Hello, thank you for reaching out. It was great connecting with you." },
  { id: "followup", title: "Follow Up", content: "Hi, following up on our conversation—just wanted to check in about next steps." },
  { id: "meeting", title: "Meeting Request", content: "Hello, I would like to schedule a meeting to discuss this further. Please share your availability." },
  { id: "intro", title: "Introduction", content: "Hi, I'm [Your Name] from [Company]. I wanted to introduce myself and explore opportunities to collaborate." }
];

const LOCAL_KEYS = {
  HISTORY: "emailAssistant.history.v1",
  FAVORITES: "emailAssistant.favorites.v1",
  PROFILE: "emailAssistant.profile.v1"
};

export default function App() {
  const [emailContent, setEmailContent] = useState("");
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [profile, setProfile] = useState({ name: "", title: "" });
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const h = JSON.parse(localStorage.getItem(LOCAL_KEYS.HISTORY) || "[]");
    const f = JSON.parse(localStorage.getItem(LOCAL_KEYS.FAVORITES) || "[]");
    const p = JSON.parse(localStorage.getItem(LOCAL_KEYS.PROFILE) || "{}");
    setHistory(h);
    setFavorites(f);
    setProfile({ name: p.name || "", title: p.title || "" });
  }, []);

  // Save history / favorites automatically on change
  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  // Initialize Web Speech API (voice-to-text)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-US";
    recog.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      // append to text field (don't overwrite user typed full content)
      setEmailContent((prev) => (prev + (final || interim)).trim());
    };
    recog.onerror = (evt) => {
      console.warn("Speech recognition error:", evt);
      setListening(false);
    };
    recog.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recog;
    // do NOT start automatically
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedReply("");
    try {
      // Example call to backend — if you want to use AI generation via backend.
      // If backend not available, fallback to a simple template-style response.
      let reply = "";
      try {
        const response = await axios.post("http://localhost:9091/api/email/generate", {
          emailContent,
          tone,
          profile
        }, { timeout: 8000 });
        reply = typeof response.data === "string" ? response.data : response.data.reply || JSON.stringify(response.data);
      } catch (err) {
        // Fallback generator (offline)
        reply = fallbackGenerate(emailContent, tone, profile);
      }

      setGeneratedReply(reply);
      setSubject(generateSubjectLine(emailContent));
      // save to history (top)
      const entry = { id: Date.now(), prompt: emailContent, reply, tone, subject, createdAt: new Date().toISOString() };
      setHistory((prev) => [entry, ...prev].slice(0, 50)); // keep last 50
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error generating reply:", error);
      setGeneratedReply("Error generating reply. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setSnackbarOpen(false), 1400);
    }
  };

  const fallbackGenerate = (content, tone, profile) => {
    // Very simple offline generator: uses profile fields and tone to craft a reply
    let base = content || "Thanks for reaching out.";
    let greeting = "Hello";
    if (tone === "casual") greeting = "Hey";
    else if (tone === "friendly") greeting = "Hi there";
    const namePart = profile.name ? `\n\nBest,\n${profile.name}${profile.title ? `\n${profile.title}` : ""}` : "\n\nBest regards";
    return `${greeting},\n\nThank you for your message. ${base}\n\nI enjoyed our conversation and look forward to staying in touch.${namePart}`;
  };

  const generateSubjectLine = (content) => {
    if (!content) return "Follow-up from our meeting";
    // pick some keywords, naive approach
    const words = content.replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
    const keywords = Array.from(new Set(words.slice(0, 6))).join(" ");
    return `Re: ${keywords || "Great connecting!"}`.slice(0, 80);
  };

  const handleCopy = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    setSnackbarOpen(true);
  };

  const handleDownloadTxt = () => {
    if (!generatedReply) return;
    const blob = new Blob([generatedReply], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-reply.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!generatedReply) return;
    // open a new window with content and fire print — user can Save as PDF
    const html = `
      <html>
        <head>
          <title>Generated Reply</title>
        </head>
        <body style="font-family: Arial; padding: 40px;">
          <pre style="white-space: pre-wrap; font-size: 14px;">${escapeHtml(generatedReply)}</pre>
        </body>
      </html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup blocked — allow popups to download as PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
    // give time to render then print
    setTimeout(() => {
      w.print();
    }, 500);
  };

  const escapeHtml = (unsafe) => {
    return unsafe
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  };

  const handleClear = () => {
    setEmailContent("");
    setGeneratedReply("");
    setTone("");
    setSubject("");
  };

  const handleTemplateSelect = (id) => {
    setSelectedTemplate(id);
    const t = TEMPLATES.find((x) => x.id === id);
    if (t) setEmailContent((prev) => (prev ? prev + "\n\n" + t.content : t.content));
  };

  const toggleFavorite = (entry) => {
    const exists = favorites.find((f) => f.id === entry.id);
    if (exists) setFavorites((prev) => prev.filter((f) => f.id !== entry.id));
    else setFavorites((prev) => [entry, ...prev]);
  };

  const removeHistoryItem = (id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const startListening = () => {
    const recog = recognitionRef.current;
    if (!recog) return alert("Speech Recognition not supported in this browser.");
    try {
      recog.start();
      setListening(true);
    } catch (e) {
      console.warn(e);
    }
  };

  const stopListening = () => {
    const recog = recognitionRef.current;
    if (!recog) return;
    try {
      recog.stop();
    } catch (e) {
      console.warn(e);
    }
    setListening(false);
  };

  const saveProfile = () => {
    // profile state already persisted by effect
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 1200);
  };

  // Simple smart transforms (very naive rule-based)
  const makeFormal = () => {
    if (!generatedReply) return;
    let txt = generatedReply;
    txt = txt.replace(/\bhey\b/gi, "Hello");
    txt = txt.replace(/\bhi\b/gi, "Hello");
    txt = txt.replace(/\byou're\b/gi, "you are");
    txt = txt.replace(/\bthanks\b/gi, "Thank you");
    txt = txt.replace(/\bcheers\b/gi, "Regards");
    setGeneratedReply(txt);
  };

  const makeCasual = () => {
    if (!generatedReply) return;
    let txt = generatedReply;
    txt = txt.replace(/\bhello\b/gi, "Hey");
    txt = txt.replace(/\bthank you\b/gi, "Thanks");
    txt = txt.replace(/\bregards\b/gi, "Cheers");
    setGeneratedReply(txt);
  };

  const useHistoryItem = (item) => {
    setEmailContent(item.prompt);
    setGeneratedReply(item.reply);
    setTone(item.tone || "");
    setSubject(item.subject || "");
  };

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <>
      <AppBar position="static" sx={{ background: darkMode ? "#101010" : "linear-gradient(90deg,#4a148c,#880e4f)" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            AI Email Assistant
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{profile.name ? profile.name : "Guest"}</Typography>
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column: Editor */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 2, backgroundColor: darkMode ? "#1e1e1e" : "#fafafa", transition: "all .25s" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: "bold", color: darkMode ? "white" : "#4a148c" }}>
                    Compose / Input
                  </Typography>
                  <Box>
                    <Chip label={`Chars: ${emailContent.length}`} sx={{ mr: 1 }} />
                    <Tooltip title={listening ? "Stop voice input" : "Start voice input"}>
                      <Button
                        variant="outlined"
                        startIcon={listening ? <MicOffIcon /> : <MicIcon />}
                        onClick={() => (listening ? stopListening() : startListening())}
                        sx={{ mr: 1 }}
                      >
                        {listening ? "Stop" : "Voice"}
                      </Button>
                    </Tooltip>
                    <Button variant="outlined" onClick={() => { setEmailContent(""); }} startIcon={<ClearAllIcon />}>Clear</Button>
                  </Box>
                </Box>

                <TextField
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  fullWidth
                  multiline
                  rows={8}
                  placeholder="Paste the original email or type notes here..."
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="tone-label">Tone</InputLabel>
                      <Select labelId="tone-label" value={tone} label="Tone" onChange={(e) => setTone(e.target.value)}>
                        <MenuItem value="">Auto</MenuItem>
                        <MenuItem value="professional">Professional</MenuItem>
                        <MenuItem value="casual">Casual</MenuItem>
                        <MenuItem value="friendly">Friendly</MenuItem>
                        <MenuItem value="formal">Formal</MenuItem>
                        <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="template-label">Templates</InputLabel>
                      <Select
                        labelId="template-label"
                        value={selectedTemplate}
                        label="Templates"
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {TEMPLATES.map((t) => (
                          <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleGenerate}
                    disabled={!emailContent || loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{ background: "linear-gradient(90deg,#4a148c,#880e4f)" }}
                  >
                    {loading ? "Generating..." : "Generate Reply"}
                  </Button>

                  <Button variant="outlined" onClick={handleClear} startIcon={<DeleteIcon />}>
                    Clear All
                  </Button>

                  <Button variant="outlined" onClick={() => {
                    const s = generateSubjectLine(emailContent);
                    setSubject(s);
                  }}>
                    Generate Subject
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Profile (auto-fill)</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Your Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Your Title / Company" value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="contained" onClick={saveProfile} startIcon={<SaveIcon />}>Save Profile</Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Generated Reply, History, Favorites */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2, mb: 3, backgroundColor: darkMode ? "#141414" : "white" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>Generated Reply</Typography>
                  <Box>
                    <TextField
                      size="small"
                      placeholder="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      sx={{ mr: 1 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end"><Button size="small" onClick={() => setSubject(generateSubjectLine(emailContent))}>Auto</Button></InputAdornment>
                      }}
                    />
                    <Button variant="outlined" onClick={handleCopy} startIcon={<FileCopyIcon />} sx={{ mr: 1 }}>Copy</Button>
                    <Button variant="outlined" onClick={handleDownloadTxt} startIcon={<DownloadIcon />} sx={{ mr: 1 }}>TXT</Button>
                    <Button variant="outlined" onClick={handleDownloadPDF}>PDF</Button>
                  </Box>
                </Box>

                <TextField
                  value={generatedReply}
                  fullWidth
                  multiline
                  rows={10}
                  InputProps={{ readOnly: true }}
                  sx={{ mt: 2, backgroundColor: "#f3e5f5", borderRadius: 1 }}
                />

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Button variant="contained" onClick={makeFormal}>Make Formal</Button>
                  <Button variant="contained" onClick={makeCasual} color="secondary">Make Casual</Button>
                  <Button variant="outlined" onClick={() => {
                    if (!generatedReply) return;
                    const entry = { id: Date.now(), prompt: emailContent, reply: generatedReply, tone, subject, createdAt: new Date().toISOString() };
                    toggleFavorite(entry);
                  }}>
                    <StarBorder /> Favorite
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Favorites */}
            <Card sx={{ p: 2, mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Favorites</Typography>
                  <Button size="small" onClick={() => setFavorites([])}>Clear</Button>
                </Box>

                {favorites.length === 0 ? (
                  <Typography sx={{ mt: 2, color: "text.secondary" }}>No favorites yet</Typography>
                ) : (
                  favorites.map((f) => (
                    <Box key={f.id} sx={{ mt: 1, p: 1, borderRadius: 1, border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ maxWidth: "75%" }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>{f.subject || "No subject"}</Typography>
                        <Typography variant="body2" noWrap>{f.reply}</Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Use">
                          <Button size="small" onClick={() => useHistoryItem(f)}>Use</Button>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => removeFavorite(f.id)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>

            {/* History */}
            <Card sx={{ p: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>History</Typography>
                  <Button size="small" onClick={clearHistory}>Clear History</Button>
                </Box>

                {history.length === 0 ? (
                  <Typography sx={{ mt: 2, color: "text.secondary" }}>No history yet</Typography>
                ) : (
                  history.map((h) => (
                    <Box key={h.id} sx={{ mt: 1, p: 1, borderRadius: 1, border: "1px solid #eee" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>{h.subject || "Generated Reply"}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(h.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Box>
                          <Button size="small" onClick={() => useHistoryItem(h)}>Use</Button>
                          <IconButton size="small" onClick={() => toggleFavorite(h)} sx={{ color: favorites.find(f => f.id === h.id) ? "gold" : "inherit" }}>
                            {favorites.find(f => f.id === h.id) ? <Star /> : <StarBorder />}
                          </IconButton>
                          <IconButton size="small" onClick={() => removeHistoryItem(h.id)}><DeleteIcon /></IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body2" noWrap sx={{ mt: 1 }}>{h.reply}</Typography>
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="caption">Built with ❤️ — AI Email Assistant</Typography>
        </Box>
      </Container>

      <Snackbar open={snackbarOpen} autoHideDuration={1500} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success">Saved / Copied ✅</Alert>
      </Snackbar>
    </>
  );
}

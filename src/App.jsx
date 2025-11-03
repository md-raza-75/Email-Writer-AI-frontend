import { useState } from 'react';
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
  Grid,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmailIcon from '@mui/icons-material/Email';
import './App.css';
import axios from 'axios';

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:9091/api/email/generate", {
        emailContent,
        tone
      });

      setGeneratedReply(
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data)
      );
    } catch (error) {
      console.error("Error generating reply:", error);
      setGeneratedReply("Error generating reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedReply) {
      navigator.clipboard.writeText(generatedReply);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      {/* Enhanced Navbar */}
      <AppBar position="static" sx={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            sx={{ mr: 2 }}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmailIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Email Assistant
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: isMobile ? 'none' : 'flex' }}>
            <Button color="inherit" sx={{ mx: 1, fontWeight: 600 }}>Home</Button>
            <Button color="inherit" sx={{ mx: 1, fontWeight: 600 }}>About</Button>
            <Button color="inherit" sx={{ mx: 1, fontWeight: 600 }}>Contact</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={10} lg={8}>
            <Card sx={{ 
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)", 
              borderRadius: 4, 
              overflow: 'hidden',
              background: "linear-gradient(to bottom, #ffffff, #f8f9fa)"
            }}>
              <Box sx={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                py: 3, 
                px: 2,
                textAlign: 'center'
              }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    fontWeight: "bold", 
                    color: "white",
                    fontSize: { xs: '2rem', md: '2.5rem' }
                  }}
                >
                  Email Reply Generator
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: "rgba(255,255,255,0.8)", 
                    mt: 1,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  AI-powered email responses in seconds
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  {/* Input Section */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: "#333" }}>
                      Original Email
                    </Typography>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      variant="outlined"
                      label="Paste the email content here"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      sx={{ 
                        backgroundColor: "white", 
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#667eea',
                          },
                        }
                      }}
                    />

                    <FormControl fullWidth sx={{ mt: 3 }}>
                      <InputLabel id="tone-label">Select Tone</InputLabel>
                      <Select
                        labelId="tone-label"
                        value={tone}
                        label="Select Tone"
                        onChange={(e) => setTone(e.target.value)}
                        sx={{ 
                          backgroundColor: "white", 
                          borderRadius: 2,
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                          }
                        }}
                      >
                        <MenuItem value="">Default</MenuItem>
                        <MenuItem value="professional">Professional</MenuItem>
                        <MenuItem value="casual">Casual</MenuItem>
                        <MenuItem value="friendly">Friendly</MenuItem>
                        <MenuItem value="formal">Formal</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                      sx={{
                        mt: 3,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: 2,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                        '&:hover': {
                          boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                          background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        }
                      }}
                      onClick={handleGenerate}
                      disabled={!emailContent || loading}
                    >
                      {loading ? "Generating..." : "Generate Reply"}
                    </Button>
                  </Grid>

                  {/* Output Section */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2 
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: "#333" }}>
                        Generated Reply
                      </Typography>
                      
                      {generatedReply && (
                        <Button
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          sx={{ 
                            borderRadius: 2, 
                            borderColor: "#667eea", 
                            color: "#667eea", 
                            fontWeight: "bold",
                            '&:hover': {
                              borderColor: "#5a6fd8",
                              backgroundColor: "rgba(102, 126, 234, 0.04)"
                            }
                          }}
                          onClick={handleCopy}
                        >
                          Copy
                        </Button>
                      )}
                    </Box>
                    
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        minHeight: 300, 
                        backgroundColor: generatedReply ? "#f8f9ff" : "#f9f9f9",
                        borderRadius: 2,
                        border: generatedReply ? "1px solid #e1e5ff" : "1px dashed #ddd",
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {generatedReply ? (
                        <Typography 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6
                          }}
                        >
                          {generatedReply}
                        </Typography>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            color: '#888'
                          }}
                        >
                          <EmailIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                          <Typography variant="body1" align="center">
                            Your generated email reply will appear here
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                    
                    {generatedReply && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Typography variant="caption" color="text.secondary">
                          Click the copy button to use this reply
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Snackbar for Copy Success */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            onClose={handleCloseSnackbar} 
            sx={{ 
              fontWeight: "bold",
              borderRadius: 2
            }}
          >
            ✅ Reply copied to clipboard!
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Card, Navbar, Nav, Modal } from 'react-bootstrap';

const CLIENT_ID = 'f0d358aab09e46998f3286f7ec7dd4d4';
const REDIRECT_URI = 'http://localhost:3000'; // Update with your redirect URI
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = 'playlist-modify-public playlist-modify-private'; //user-read-private
const CLIENT_SECRET = '200a26dcd0a54fa19d98aae423721be6';

const playlistUrl = 'https://open.spotify.com/playlist/7bcqUpOUXOlRl7sKQlwo4g?si=4ve-WAonQLyQEVQXnEc1rQ&pi=a-Lrvi8mkKQt-6&pt_success=1&nd=1&dlsi=a4979d470b4f4c3c';

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [tracks, setTracks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [queuedTracks, setQueuedTracks] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [personalPlaylistName, setPersonalPlaylistName] = useState("");
  const [playlistCount, setPlaylistCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: REDIRECT_URI,
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET
            })
          });
          const data = await response.json();
          if (data.access_token) {
            setAccessToken(data.access_token);
            setLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
    };

    fetchAccessToken();
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchPlaylistInfo();
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && showPlaylistModal) {
      fetchCurrentlyPlayingTrack();
    }
  }, [accessToken, showPlaylistModal]);

  const fetchPlaylistInfo = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      const playlistData = await response.json();
      const tracksResponse = await fetch(playlistData.tracks.href, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      const tracksData = await tracksResponse.json();
      const playlistTracks = tracksData.items.map(item => item.track); // Extracting track objects
      setPlaylistTracks(playlistTracks); // Set the tracks associated with the playlist
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  };

  const fetchCurrentlyPlayingTrack = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      const data = await response.json();
      if (data.item) {
        setCurrentlyPlayingTrack(data.item);
      }
    } catch (error) {
      console.error('Error fetching currently playing track:', error);
    }
  };

  const addToPlaylist = async (track, playlistUrl) => {
    try {
      const playlistId = playlistUrl.split('/').pop().split('?')[0];
      const playlistDetailsUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;
      const response = await fetch(playlistDetailsUrl, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      const playlistData = await response.json();

      setPlaylistName(playlistData.name);
      setPlaylistCount(playlistData.tracks.total);

      const addTrackUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
      const addTrackResponse = await fetch(addTrackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
          uris: [track.uri]
        })
      });

      if (addTrackResponse.ok) {
        setPlaylistCount(prevCount => prevCount + 1);
        alert(`Successfully added "${track.name}" to your playlist!`);
      } else {
        alert('Failed to add track to playlist.');
      }
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      alert('Error adding track to playlist. Please try again.');
    }
  };

  const search = async () => {
    try {
      const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${searchInput}&type=track`, {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      const searchData = await searchResponse.json();
      console.log('Search Data:', searchData);
      if (searchData.tracks && searchData.tracks.items.length > 0) {
        setTracks(searchData.tracks.items);
      } else {
        console.log('No tracks found');
        setTracks([]);
      }
    } catch (error) {
      console.error('Error searching for track:', error);
      alert('Error searching for track. Please try again.');
    }
  };

  const toggleFavorite = (track) => {
    if (favorites.some(favorite => favorite.id === track.id)) {
      setFavorites(prevFavorites => prevFavorites.filter(favorite => favorite.id !== track.id));
    } else {
      setFavorites(prevFavorites => [...prevFavorites, track]);
    }
  };

  const addToQueue = (track) => {
    alert(`Successfully added "${track.name}" to the queue!`);
  };

  const toggleFavoritesSection = () => {
    setShowFavorites(!showFavorites);
  };

  const toggleQueueSection = () => {
    setShowQueue(!showQueue);
  };

  const playPauseTrack = () => {
    setIsPlaying(!isPlaying);
  };

  const skipTrack = () => {
    setCurrentTrackIndex(prevIndex => (prevIndex + 1) % queuedTracks.length);
  };

  const handlePlaylistCountClick = async () => {
    setShowPlaylistModal(true);
    // Fetch tracks for the playlist
    // try {
    //   const response = await fetch(playlistUrl, {
    //     headers: {
    //       'Authorization': 'Bearer ' + accessToken
    //     }
    //   });
    //   const playlistData = await response.json();
    //   const tracksResponse = await fetch(playlistData.tracks.href, {
    //     headers: {
    //       'Authorization': 'Bearer ' + accessToken
    //     }
    //   });
    //   const tracksData = await tracksResponse.json();
    //   const playlistTracks = tracksData.items.map(item => item.track); // Extracting track objects
    //   setPlaylistTracks(playlistTracks); // Set the tracks associated with the playlist
    // } catch (error) {
    //   console.error('Error fetching playlist tracks:', error);
    // }
  };

  if (!loggedIn) {
    return (
      <div className="App">
        <Button variant="primary" onClick={() => { window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES} user-read-currently-playing&response_type=code&show_dialog=true`; }}>Log in with Spotify</Button>
        {/* <Button variant="primary" onClick={() => { window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES} user-read-currently-playing&response_type=code&show_dialog=true`; }}>Log in with Spotify</Button> */}

      </div>
    );
  }
  

  return (
    <div className="App">
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#">Music Player App</Navbar.Brand>
        <Nav className="ml-auto">
          <Nav.Link>{playlistName}</Nav.Link>
          <Nav.Link onClick={handlePlaylistCountClick}>{playlistCount} Tracks</Nav.Link>
        </Nav>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ml-auto">
            <Button variant="primary" onClick={toggleFavoritesSection}>Favorites <span className="badge badge-light">{favorites.length}</span></Button>
            <Button variant="success" onClick={toggleQueueSection}>Queue <span className="badge badge-light">{queuedTracks.length}</span></Button>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Container>
        <InputGroup className="mb-3" size='lg'>
          <FormControl
            placeholder='Search for track'
            type='input'
            onKeyPress={event => {
              if (event.key === 'Enter') {
                search();
              }
            }}
            onChange={event => setSearchInput(event.target.value)}
          />
          <Button onClick={search}>
            Search
          </Button>
        </InputGroup>
      </Container>
      <Container>
        <Row className='mx-2 row row-cols-4'>
          {tracks.map((track, i) => (
            <Card key={i}>
              <Card.Img src={track.album.images[0].url} alt={track.name} />
              <Card.Body>
                <Card.Title>{track.name}</Card.Title>
                <Button variant="danger" onClick={() => toggleFavorite(track)}>
                  {favorites.some(favorite => favorite.id === track.id) ? '❤️' : '🤍'}
                </Button>
                <Button variant="success" onClick={() => addToPlaylist(track, playlistUrl)}>Add to Playlist</Button>
                <Button variant="success" onClick={() => addToQueue(track)}>Add to Queue</Button>
              </Card.Body>
            </Card>
          ))}
        </Row>
      </Container>
      <Modal show={showFavorites} onHide={toggleFavoritesSection}>
        <Modal.Header closeButton>
          <Modal.Title>Favorites</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row className='mx-2 row row-cols-4'>
              {favorites.map((track, i) => (
                <Card key={i}>
                  <Card.Img src={track.album.images[0].url} alt={track.name} />
                  <Card.Body>
                    <Card.Title>{track.name}</Card.Title>
                  </Card.Body>
                </Card>
              ))}
            </Row>
          </Container>
        </Modal.Body>
      </Modal>
      <Modal show={showQueue} onHide={toggleQueueSection}>
        <Modal.Header closeButton>
          <Modal.Title>Queue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row className='mx-2 row row-cols-4'>
              {queuedTracks.map((track, i) => (
                <Card key={i}>
                  <Card.Img src={track.album.images[0].url} alt={track.name} />
                  <Card.Body>
                    <Card.Title>{track.name}</Card.Title>
                  </Card.Body>
                </Card>
              ))}
            </Row>
          </Container>
        </Modal.Body>
      </Modal>
      <Modal show={showPlaylistModal} onHide={() => setShowPlaylistModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>{playlistName} Tracks</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <ul>
    {playlistTracks.map((track, index) => (
      <li key={index}>
        {track.name} 
        {console.log('currentlyPlayingTrack:', currentlyPlayingTrack)}
        {console.log('track.id:', track.id)}
        {currentlyPlayingTrack && currentlyPlayingTrack.id === track.id && <span>(Currently Playing)</span>}
      </li>
      ))}
    </ul>
  </Modal.Body>
</Modal>

    </div>
  );
}

export default App;

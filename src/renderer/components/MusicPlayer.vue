<template>
  <div class="player-grid">
    <div class="side-bar">
      <sidebar @setShowPlaylists="setShowPlaylists"></sidebar>
    </div>
    <div class="tab-content">
      <song-list v-if="!isShowPlaylists"></song-list>
      <playlist v-else-if="isShowPlaylists"></playlist>
    </div>
    <div class="playback-controller">
      <playback-controller></playback-controller>
    </div>
  </div>
</template>

<script>
import Sidebar from './Sidebar'
import { ipcRenderer } from 'electron'
import SongList from '@/components/SongList'
import PlaybackController from './PlaybackController'
import Playlist from '@/components/Playlist'
import { mapActions, mapGetters } from 'vuex'
import webAudioBuilder from 'waveform-data/webaudio'
import { deep, DTW, kdt, seriesDTW } from '@/backend/machineLearning'

const audioCtx = new AudioContext()
const getWaveform = (songData) => {
  return new Promise((resolve, reject) => {
    webAudioBuilder(audioCtx, songData.buffer.slice(0), (err, waveform) => {
      if (err) reject(err)
      try {
        resolve(waveform.resample({width: 1024}))
      } catch (e) {
        if (e) resolve(waveform)
      }
    })
  })
}

export default {
  name: 'music-player',
  components: { Sidebar, SongList, PlaybackController, Playlist },
  data () {
    return {
      isShowPlaylists: false,
      loading: false
    }
  },
  mounted () {
    ipcRenderer.on('playlist:receiveName', (event, playlists) => {
      let tempPlaylists = []
      playlists.forEach(playlist => {
        tempPlaylists.push(playlist.dataValues)
      })
      this.setPlaylists(tempPlaylists)
      this.setCurrentPlaylist(this.getPlaylistByIndex(0))
      ipcRenderer.send('songList:find', { playlistId: this.getCurrentPlaylist.id, isDeleteSong: false })
    })
  },
  created () {
    ipcRenderer.send('playlist:requestName')

    ipcRenderer.on('playlist:callRequest', event => {
      ipcRenderer.send('playlist:requestName')
    })

    ipcRenderer.on('songList:retrieve', (event, songs) => {
      this.setShowingSongs(songs)
      this.setSonglistLoading(false)
    })

    ipcRenderer.on('songList:retrieveAfterDelete', (event, songs) => {
      this.setShowingSongs(songs)
      this.setSongs(this.getShowingSongs)
      this.setSonglistLoading(false)
    })

    ipcRenderer.on('play:song', (event, songInfo) => {
      this.initializePlayer(songInfo)
    })

    ipcRenderer.on('songList:refresh', (event, { isDeleteSong, isDropSong }) => {
      this.refreshSongList(isDeleteSong)
    })

    ipcRenderer.on('retrieveRecommended:playlist', (event, recommendedPlaylist) => {
      this.setShowingSongs(recommendedPlaylist)
      this.setSongs(this.getShowingSongs)
      this.setSonglistLoading(false)
    })

    ipcRenderer.on('song:requestWaveform', (event, song) => {
      let { songData, songMetadata } = song
      getWaveform(songData)
        .then(waveform => {
          ipcRenderer.send('song:result', {
            id: songMetadata.id,
            waveMax: waveform.max,
            waveMin: waveform.min,
            playlist: this.getCurrentPlaylist,
            isPlaying: this.isPlaying
          })
        })
    })

    ipcRenderer.on('ml-drop:refresh', async (event) => {
      const currentSong = {
        id: this.getSelectedSong.id,
        playlistId: this.getCurrentPlaylist.id
      }
      switch (this.getSelectedAlgorithm) {
        case 'deep':
          this.setShowingSongs(await deep(currentSong))
          break
        case 'kdt':
          this.setShowingSongs(await kdt(currentSong))
          break
        case 'DTW':
          this.setShowingSongs(await DTW(currentSong))
          break
        case 'seriesDTW':
          this.setShowingSongs(await seriesDTW(currentSong))
          break
      }
      this.setSongs(this.getShowingSongs)
      this.setSonglistLoading(false)
    })
  },
  beforeDestroy () {
    this.stopSong()
    audioCtx.close()
  },
  methods: {
    setShowPlaylists: function (showPlaylists) {
      this.isShowPlaylists = showPlaylists
    },
    updateTime: async function () {
      if (this.getSelectedSong.id) {
        let player = await this.getPlayer
        await new Promise((resolve, reject) => {
          this.setContextTime(player.context.currentTime)
          window.requestAnimationFrame(this.updateTime)
          resolve()
        })
      }
    },
    refreshSongList: function (isDeleteSong) {
      ipcRenderer.send('songList:find', { playlistId: this.getCurrentPlaylist.id, isDeleteSong })
    },
    initializePlayer: async function (songInfo) {
      await this.stopSong()
      await this.playSong(songInfo, this.updateTime)
      this.updateTime()
    },
    storageAvailable: function (type) {
      let storage
      try {
        storage = window[type]
        let x = '__storage_test__'
        storage.setItem(x, x)
        storage.removeItem(x)
        return true
      } catch (e) {
        return e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
          // acknowledge QuotaExceededError only if there's something already stored
          storage.length !== 0
      }
    },
    ...mapActions([
      'setShowingSongs',
      'setSongs',
      'setSeekTIme',
      'setContextTime',
      'createPlayer',
      'playSong',
      'stopSong',
      'setPlaylists',
      'setCurrentPlaylist',
      'setSonglistLoading'
    ])
  },
  computed: {
    ...mapGetters([
      'getSeekTime',
      'getContextTime',
      'getSongDuration',
      'getPlayer',
      'getSelectedSong',
      'getPlaylistByIndex',
      'getCurrentPlaylist',
      'getShowingSongs',
      'getSelectedAlgorithm',
      'isPlaying'
    ])
  }
}
</script>

<style>
  html, body {
    margin: 0;
    height: 100%;
    overflow-y: hidden;
    background-color: #272727;
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  }

  th.gutter {
    background-color: #272727;
  }

  /* width */
  ::-webkit-scrollbar {
      width: 1rem;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: #474747; 
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    width: 80%;
    background: #F10707;
    border:solid #474747;
    border-width: medium thin medium thin;
    border-radius: 0.15em;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #FB5C5C; 
  }
</style>

<style scoped>

  .side-bar {
    grid-area: sb;
  }

  .tab-content {
    grid-area: tc;
  }

  .playback-controller {
    grid-area: pc;
  }

  .player-grid {
    display: grid;
    grid-template:
    "sb tc tc tc tc" 1fr
    "sb tc tc tc tc" 1fr
    "sb tc tc tc tc" 1fr
    "pc pc pc pc pc" 1fr / 2fr 3fr 3fr 3fr 3fr;
  }
</style>

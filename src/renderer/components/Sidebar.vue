<template>
  <div class="sidebar-grid">
    <el-tooltip effect="light" placement="right">
      <div slot="content">Recommend<br/>Songs</div>
      <button class="themed-btn rotate-left" @click="setCurrentTab(0)" :class="{ down: this.getCurrentTab === 0 }">
        <icon name="thumbs-up" scale="2" color="#F4F4F4"></icon>
      </button>
    </el-tooltip>
    <el-tooltip effect="light" placement="right">
      <div slot="content">All<br/>Songs</div>
      <button class="themed-btn rotate-left" @click="setCurrentTab(1)" :class="{ down: this.getCurrentTab === 1 }">
        <icon name="music" scale="2" color="#F4F4F4"></icon>
        <icon name="asterisk" scale="1" color="#F4F4F4"></icon>
      </button>
    </el-tooltip>
    <el-tooltip effect="light" placement="right">
      <div slot="content">Custom<br/>Playlists</div>
      <button class="themed-btn rotate-left" @click="showAllPlaylists()" :class="{ down: this.getCurrentTab === 2 }">
        <icon name="list" scale="2" color="#F4F4F4"></icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapActions, mapGetters } from 'vuex'

export default {
  props: ['isShowPlaylists'],
  methods: {
    highlight: function (e) {
      e.target.style.backgroundColor = 'black'
      let icons = e.target.childNodes
      icons.forEach((icon) => {
        if (icon.nodeName === 'svg') {
          icon.style.fill = '#F4F4F4'
        }
      })
    },
    unhighlight: function (e) {
      e.target.style.backgroundColor = '#F4F4F4'
      let icons = e.target.childNodes
      icons.forEach((icon) => {
        if (icon.nodeName === 'svg') {
          icon.style.fill = 'black'
        }
      })
    },
    setCurrentTab: function (playlistIndex) {
      this.setTab(playlistIndex)
      this.$emit('setShowPlaylists', false)
      this.setCurrentPlaylist(this.getPlaylistByIndex(playlistIndex))
      ipcRenderer.send('songList:find', { playlistId: this.getCurrentPlaylist.id, isDeleteSong: false })
    },
    showAllPlaylists: function () {
      this.setTab(2)
      this.$emit('setShowPlaylists', true)
    },
    ...mapActions([
      'setCurrentPlaylist',
      'setTab'
    ])
  },
  computed: {
    ...mapGetters([
      'getPlaylistByIndex',
      'getCurrentPlaylist',
      'getCurrentTab'
    ])
  }
}
</script>

<style scoped>
  .tab-box {
    width: 95%;
    grid-area: 'tb';
    display: grid;
    justify-items: center;
    align-items: center;
    margin-left: 0;
  }

  .rec-cell {
    grid-area: 'rc'
  }

  .playlists-cell {
    grid-area: 'pc'
  }

  .all-songs-cell {
    grid-area: 'ac'
  }

  .create-cell {
    grid-area: 'cc'
  }

  .sidebar-grid {
    width: 100%;
    height: 60%;
    background-color: #272727;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    /* justify-items:  */
    align-items: center;
  }

  .tab-icon-inline {
    display: inline-flex; align-items: center; justify-content: center;
  }

  .themed-btn {
    width: 80%;
    height: 25%;
    background-color:#F10707;
    /* border:solid #F4F4F4; */
    border-style: solid;
    border-color: #F4F4F4 #272727 #F4F4F4 #F4F4F4;
    border-width: medium thin medium 1em;
    margin:0.5rem 0 0 0;
    transition-property: border-width;
    transition-duration: 0.25s;
    border-radius: 0.15em;
  }

  .themed-btn:hover {
    background-color: #FB5C5C;
    animation-duration: 0.4s;
    animation-name: bounce;
    animation-iteration-count: 1;
  }

  @keyframes bounce {
    0% {
      width: 80%;
      height: 30%;
    }
    50% {
      margin-top: 2rem;
      width: 90%;
      height: 15%;
    }
    100% {
      width: 80%;
      height: 30%;
    }
  }

  .themed-btn.down {
    background-color: #F10707;
    border-width: medium thin medium thin;
  }

  .rotate-left {
    transform: rotate(-15deg);
  }

  .rotate-right {
    transform: rotate(15deg);
  }

  .themed-btn:first-child {
    margin-top: 1.5rem;
  }
</style>

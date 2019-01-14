import React, { Component } from 'react'
import Counter from './components/Counter'
import Controls from './components/Controls'

class App extends Component {
  constructor () {
    super()
    this.state = {
      state: null,
      total: 1500,
      count: 0,
      totalPause: 300,
      countPause: 0,
      cardsClass: undefined
    }

    // Listeners for the Tray menu
    window.ipcRenderer.on('start', this.start)
    window.ipcRenderer.on('stop', this.stop)
    // Send `handshake` event to receive new value from the store
    window.ipcRenderer.send('handshake')
  }

  componentDidMount () {
    // Receive new values from the store
    window.ipcRenderer.on('updateValues', (event, data) => {
      this.setState({
        total: data.work,
        totalPause: data.pause
      })
    })
  }


  /**
   * Launch the counter
   * Creates the `countInterval` variable
   * Send `counting` event to the main process
   */
  start = () => {
    if (this.state.state === 'counting') return // If already counting return
    this.countInterval = setInterval(this.increment, 1000)
    this.setState({
      state: 'counting'
    })
    window.ipcRenderer.send('counting')
  }
  

  /**
   * Triggered every 1s when `state.state` = counting
   * Increment the `state.count`
   * Create the `pauseInterval` when `state.count` > `state.total`
   */
  increment = () => {
    if (this.state.count >= this.state.total) {
      // Max value for `this.state`
      // Switch into the `pauseInterval`
      this.stop()
      this.setState({
        state: 'pausing'
      })
      window.ipcRenderer.send('pausing')
      return this.pauseInterval = setInterval(this.incrementPause, 1000)
    }
    this.setState(prevState => ({
      count: prevState.count + 1
    }))
  }


  /**
   * Triggered every 1s when `state.isPause` = true
   * Increment the `state.countPause`
   * Switch to the `countInterval`
   */
  incrementPause = () => {
    if (this.state.countPause >= this.state.totalPause) {
      // Max value for `state.countPause`
      // Switch into the `countInterval`
      this.stop()
      window.ipcRenderer.send('counting')
      return this.start()
    }
    this.setState(prevState => ({
      countPause: prevState.countPause + 1
    }))
  }

  /**
   * Clear all intervals
   * Clear the state
   * Send `idle` event to the main process
   */
  stop = () => {
    clearInterval(this.countInterval)
    clearInterval(this.pauseInterval)
    this.setState({
      state: null,
      count: 0,
      countPause: 0
    })
    window.ipcRenderer.send('idle')
  }

  
  /**
   *  Set a new value for work time
   */
  setWork = (minutes) => {
    const seconds = parseInt(minutes) === 0 ? 1500 : minutes*60
    this.setState({
      total: seconds
    })
    window.ipcRenderer.send('updateStore', {
      work: seconds,
      pause: this.state.totalPause
    })
  }

  /**
   *  Set a new value for pause time
   */
  setPause = (minutes) => {
    const seconds = parseInt(minutes) === 0 ? 300 : minutes*60
    this.setState({
      totalPause: seconds
    })
    window.ipcRenderer.send('updateStore', {
      work: this.state.total,
      pause: seconds
    })
  }

  toggleCards = () => {
    if (!this.state.cardsClass) {
      this.setState({
        cardsClass: 'show'
      })
    } else {
      this.setState({
        cardsClass: undefined
      })
    }
  }

  render() {

    return (
      <div className="container">

        <div onClick={this.toggleCards} className={`cards ${this.state.cardsClass}`}>
          <div onClick={(e) => e.stopPropagation()} className="card green">
            <h2>Streak</h2>
            <i className="material-icons">keyboard_arrow_right</i>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="card blue">
            <h2>Statistics</h2>
            <i className="material-icons">keyboard_arrow_right</i>
          </div>
        </div>

        <Counter {...this.state} />

        <Controls
          state={this.state.state}
          total={this.state.total}
          totalPause={this.state.totalPause}
          start={this.start}
          stop={this.stop}
          setWork={this.setWork}
          setPause={this.setPause}
          toggleCards={this.toggleCards}
        />
      </div>
    )
  }
}

export default App

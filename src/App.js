import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      sw : {
        status: 'not registered',
        ready: false,
        subscribed: false,
        onPushRegistered: false,
        permissionNotification: 'undefined',
        registration: null,
        subscription: null
      }
    }
  }

  showSubscription = () => {
    console.log(this.state.sw.subscription.toJSON())
  }

  componentDidMount() {
    let sw = this.state.sw;
    if(!('serviceWorker' in navigator)) {
      sw.status = 'sw not supported';
    } 
    // Caso exista service worker, tenta ativa-lo
    if(('serviceWorker' in navigator)) {
      sw.status = 'available (not ready)';
      navigator.serviceWorker.ready
      .then((serviceWorkerRegistration) => {
        sw.status = 'registered';
        sw.ready = true;
        sw.registration = serviceWorkerRegistration;
        this.setState({
          sw
        })
      })
      .catch(err => console.log('Erro no register do sw:', err))
      this.setState({
        sw
      })
    }

    this.setState({
      sw,
      permissionNotification: Notification.permission
    })
  }

  askNotificationPermission = () => {
    this.setState({
      permissionNotification: Notification.permission
    })
    if( Notification.permission === 'denied' ) {
      alert('Você proibiu as notificações, redefina as configurações para receber mensagens')
    }
    Notification.requestPermission((status) => {
      this.setState({
        permissionNotification: status
      })
    });
  }

  subscribe = () => {
    let sw  = this.state.sw;
    console.log('sw', sw)
    let swReg = sw.registration;

    const vapidPublicKey = 'BIJm2e5LVBfLbpLF6XLI92izLqbStL+UbRBFq99XUZ4R4OLqL/2B4wZEe7rHuARapjRVphbxQxyVta0Azo/2dKA=';

    const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

    swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    }).then((subscription) => {
      sw.subscribed = true;
      sw.subscription = subscription;
      console.log('subscription', subscription)
      this.setState({
        sw
      })

      this.registerOnPush(swReg);
    });

    
  }

  registerOnPush = (swReg) => {
    swReg.active.addEventListener("push", (event) => {
      console.log("push received");
      let title = (event.data && event.data.text()) || "Yay a message";
      let body = "We have received a push message";
      let tag = "push-simple-demo-notification-tag";
      let icon = '/assets/my-logo-120x120.png';

      event.waitUntil(
        swReg.showNotification(title, { body, icon, tag })
      )
    });

    let sw= this.state.sw;
    sw.onPushRegistered = true;
    this.setState({
      sw
    })
    console.log(swReg)
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="bell" alt="logo" />
          <ul>
            <h4>Service Worker</h4>
            <li>{ this.state.sw.status }</li>
            { this.state.sw.ready && (
              <li>ready</li>
            )}
            { this.state.sw.subscribed && (
              <li>subscribed <button onClick={this.showSubscription}>Show subscription</button></li>
            )}
            { !this.state.sw.subscribed && (
              <li>not subscribed <button onClick={this.subscribe}>Subscribe</button></li>
            )}
            { this.state.sw.onPushRegistered && (
              <li>push registered</li>
            )}
          </ul>
          <ul>
            <h4>Notificações</h4>
            <li>{this.state.permissionNotification} {this.state.permissionNotification !== 'granted' && (<button onClick={this.askNotificationPermission}>i want notifications!</button>)}</li>
          </ul>
        </header>
      </div>
    );
  }

  // Utility function
  // Chrome doesnt support base64String
  urlBase64ToUint8Array = (base64String) => {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default App;

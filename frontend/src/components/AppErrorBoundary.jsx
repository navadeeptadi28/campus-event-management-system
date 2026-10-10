import React from 'react';
export default class AppErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return {error};}
  componentDidCatch(error,info){console.error('CampusEvents UI error',error,info);}
  render(){if(this.state.error)return <div className="center-page"><div className="panel" style={{maxWidth:760,margin:'40px auto'}}><h2>Page could not be loaded</h2><p className="muted">{this.state.error.message||'Unexpected application error'}</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>Reload page</button></div></div>;return this.props.children;}
}

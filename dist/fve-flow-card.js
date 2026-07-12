function t(t,e,n,s){var o,r=arguments.length,a=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,n):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,n,s);else for(var i=t.length-1;i>=0;i--)(o=t[i])&&(a=(r<3?o(a):r>3?o(e,n,a):o(e,n))||a);return r>3&&a&&Object.defineProperty(e,n,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,n=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let r=class{constructor(t,e,n){if(this._$cssResult$=!0,n!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(n&&void 0===t){const n=void 0!==e&&1===e.length;n&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),n&&o.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const n=1===t.length?t[0]:e.reduce((e,n,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+t[s+1],t[0]);return new r(n,t,s)},i=n?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const n of t.cssRules)e+=n.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,m=globalThis,y=m.trustedTypes,u=y?y.emptyScript:"",f=m.reactiveElementPolyfillSupport,g=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?u:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=null!==t;break;case Number:n=null===t?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch(t){n=null}}return n}},x=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let v=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const n=Symbol(),s=this.getPropertyDescriptor(t,n,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,n){const{get:s,set:o}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);o?.call(this,e),this.requestUpdate(t,r,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const n of e)this.createProperty(n,t[n])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,n]of e)this.elementProperties.set(t,n)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const n=this._$Eu(t,e);void 0!==n&&this._$Eh.set(n,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const n=new Set(t.flat(1/0).reverse());for(const t of n)e.unshift(i(t))}else void 0!==t&&e.push(i(t));return e}static _$Eu(t,e){const n=e.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const n of e.keys())this.hasOwnProperty(n)&&(t.set(n,this[n]),delete this[n]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(n)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const n of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=n.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,n){this._$AK(t,n)}_$ET(t,e){const n=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,n);if(void 0!==s&&!0===n.reflect){const o=(void 0!==n.converter?.toAttribute?n.converter:$).toAttribute(e,n.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const n=this.constructor,s=n._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=n.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=s;const r=o.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,n,s=!1,o){if(void 0!==t){const r=this.constructor;if(!1===s&&(o=this[t]),n??=r.getPropertyOptions(t),!((n.hasChanged??x)(o,e)||n.useDefault&&n.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,n))))return;this.C(t,e,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:n,reflect:s,wrapped:o},r){n&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||n||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,n]of t){const{wrapped:t}=n,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,n,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};v.elementStyles=[],v.shadowRootOptions={mode:"open"},v[g("elementProperties")]=new Map,v[g("finalized")]=new Map,f?.({ReactiveElement:v}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,E=w.trustedTypes,A=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+P,M=`<${C}>`,z=document,L=()=>z.createComment(""),j=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,T="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,V=/>/g,F=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,R=/"/g,I=/^(?:script|style|textarea|title)$/i,D=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),W=D(1),B=D(2),Z=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),G=new WeakMap,K=z.createTreeWalker(z,129);function J(t,e){if(!H(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const Y=(t,e)=>{const n=t.length-1,s=[];let o,r=2===e?"<svg>":3===e?"<math>":"",a=O;for(let e=0;e<n;e++){const n=t[e];let i,l,c=-1,h=0;for(;h<n.length&&(a.lastIndex=h,l=a.exec(n),null!==l);)h=a.lastIndex,a===O?"!--"===l[1]?a=N:void 0!==l[1]?a=V:void 0!==l[2]?(I.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=F):void 0!==l[3]&&(a=F):a===F?">"===l[0]?(a=o??O,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,i=l[1],a=void 0===l[3]?F:'"'===l[3]?R:U):a===R||a===U?a=F:a===N||a===V?a=O:(a=F,o=void 0);const d=a===F&&t[e+1].startsWith("/>")?" ":"";r+=a===O?n+M:c>=0?(s.push(i),n.slice(0,c)+S+n.slice(c)+P+d):n+P+(-2===c?e:d)}return[J(t,r+(t[n]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class Q{constructor({strings:t,_$litType$:e},n){let s;this.parts=[];let o=0,r=0;const a=t.length-1,i=this.parts,[l,c]=Y(t,e);if(this.el=Q.createElement(l,n),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=K.nextNode())&&i.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(S)){const e=c[r++],n=s.getAttribute(t).split(P),a=/([.?@])?(.*)/.exec(e);i.push({type:1,index:o,name:a[2],strings:n,ctor:"."===a[1]?st:"?"===a[1]?ot:"@"===a[1]?rt:nt}),s.removeAttribute(t)}else t.startsWith(P)&&(i.push({type:6,index:o}),s.removeAttribute(t));if(I.test(s.tagName)){const t=s.textContent.split(P),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let n=0;n<e;n++)s.append(t[n],L()),K.nextNode(),i.push({type:2,index:++o});s.append(t[e],L())}}}else if(8===s.nodeType)if(s.data===C)i.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(P,t+1));)i.push({type:7,index:o}),t+=P.length-1}o++}}static createElement(t,e){const n=z.createElement("template");return n.innerHTML=t,n}}function X(t,e,n=t,s){if(e===Z)return e;let o=void 0!==s?n._$Co?.[s]:n._$Cl;const r=j(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,n,s)),void 0!==s?(n._$Co??=[])[s]=o:n._$Cl=o),void 0!==o&&(e=X(t,o._$AS(t,e.values),o,s)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:n}=this._$AD,s=(t?.creationScope??z).importNode(e,!0);K.currentNode=s;let o=K.nextNode(),r=0,a=0,i=n[0];for(;void 0!==i;){if(r===i.index){let e;2===i.type?e=new et(o,o.nextSibling,this,t):1===i.type?e=new i.ctor(o,i.name,i.strings,this,t):6===i.type&&(e=new at(o,this,t)),this._$AV.push(e),i=n[++a]}r!==i?.index&&(o=K.nextNode(),r++)}return K.currentNode=z,s}p(t){let e=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(t,n,e),e+=n.strings.length-2):n._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,n,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=n,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),j(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>H(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&j(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:n}=t,s="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=Q.createElement(J(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new tt(s,this),n=t.u(this.options);t.p(e),this.T(n),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new Q(t)),e}k(t){H(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let n,s=0;for(const o of t)s===e.length?e.push(n=new et(this.O(L()),this.O(L()),this,this.options)):n=e[s],n._$AI(o),s++;s<e.length&&(this._$AR(n&&n._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class nt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,n,s,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=q}_$AI(t,e=this,n,s){const o=this.strings;let r=!1;if(void 0===o)t=X(this,t,e,0),r=!j(t)||t!==this._$AH&&t!==Z,r&&(this._$AH=t);else{const s=t;let a,i;for(t=o[0],a=0;a<o.length-1;a++)i=X(this,s[n+a],e,a),i===Z&&(i=this._$AH[a]),r||=!j(i)||i!==this._$AH[a],i===q?t=q:t!==q&&(t+=(i??"")+o[a+1]),this._$AH[a]=i}r&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends nt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class ot extends nt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class rt extends nt{constructor(t,e,n,s,o){super(t,e,n,s,o),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??q)===Z)return;const n=this._$AH,s=t===q&&n!==q||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,o=t!==q&&(n===q||s);s&&this.element.removeEventListener(this.name,this,n),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,n){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const it=w.litHtmlPolyfillSupport;it?.(Q,et),(w.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;class ct extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,n)=>{const s=n?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=n?.renderBefore??null;s._$litPart$=o=new et(e.insertBefore(L(),t),t,void 0,n??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}}ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const ht=lt.litElementPolyfillSupport;ht?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,n)=>{void 0!==n?n.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:x},_t=(t=pt,e,n)=>{const{kind:s,metadata:o}=n;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(n.name,t),"accessor"===s){const{name:s}=n;return{set(n){const o=e.get.call(this);e.set.call(this,n),this.requestUpdate(s,o,t,!0,n)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=n;return function(n){const o=this[s];e.call(this,n),this.requestUpdate(s,o,t,!0,n)}}throw Error("Unsupported decorator location: "+s)};function mt(t){return(e,n)=>"object"==typeof n?_t(t,e,n):((t,e,n)=>{const s=e.hasOwnProperty(n);return e.constructor.createProperty(n,t),s?Object.getOwnPropertyDescriptor(e,n):void 0})(t,e,n)}function yt(t){return mt({...t,state:!0,attribute:!1})}const ut=968;const ft={red:"#ff5252",yellow:"#ffd740",green:"#00e676"};function gt(t,e){if(!e||null==e.yellow_from&&null==e.green_from)return;const n=e.yellow_from??e.green_from,s=Math.max(e.green_from??e.yellow_from,n);let o=t<n?"red":t<s?"yellow":"green";return e.severity_invert&&(o="red"===o?"green":"green"===o?"red":"yellow"),ft[o]}function $t(t,e,n=0){if(!t||!e)return n;const s=t.states[e];if(!s)return n;const o=parseFloat(s.state);return Number.isFinite(o)?o:n}function xt(t,e){if(!t||!e)return!1;const n=t.states[e];return!!n&&Number.isFinite(parseFloat(n.state))}const bt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:1}),vt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}),wt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:0});function kt(t){const e=Math.abs(t);return e>=1e4?`${bt.format(t/1e3)} kW`:e>=1e3?`${vt.format(t/1e3)} kW`:`${wt.format(t)} W`}function Et(t){return Math.abs(t)>=1e3?`${vt.format(t/1e3)} MWh`:`${bt.format(t)} kWh`}function At(t,e){if(!t||!e)return"—";const n=t.states[e];if(!n||"unknown"===n.state||"unavailable"===n.state)return"—";const s=n.attributes.unit_of_measurement??"",o=parseFloat(n.state);return Number.isFinite(o)&&String(o)===n.state.trim()?s?`${bt.format(o)} ${s}`:bt.format(o):t.formatEntityState?t.formatEntityState(n):s?`${n.state} ${s}`:n.state}function St(t,e,n){t.dispatchEvent(new CustomEvent(e,{detail:n,bubbles:!0,composed:!0,cancelable:!1}))}function Pt(t,e){e&&St(t,"hass-more-info",{entityId:e})}function Ct(t,e,n){if(n.hidden)return q;const s=n.animate&&Math.abs(n.power)>=n.deadband,o=`flow-${t}`,r=B`
    <path id="${o}" d="${e}" fill="none"
      stroke="${s?n.color:"rgba(148, 170, 190, 0.16)"}"
      stroke-width="${s?3:2}"
      stroke-linecap="round"
      opacity="${s?.85:1}"
      style="${s?`filter: drop-shadow(0 0 4px ${n.color})`:""}"/>`;if(!s)return r;const a=function(t,e,n,s){const o=Math.min(1,Math.max(0,t/Math.max(1,e))),r=Math.max(n,s-o*(s-n));return Math.round(4*r)/4}(Math.abs(n.power),n.maxPower,n.minDuration,n.maxDuration),i=n.reverse?"1;0":"0;1",l=Math.max(1,n.dots),c=[];for(let t=0;t<l;t++){const e=-(t*a/l).toFixed(2);c.push(B`
      <circle cx="0" cy="0" r="5" fill="${n.color}"
        style="filter: drop-shadow(0 0 6px ${n.color})">
        <animateMotion dur="${a}s" begin="${e}s" repeatCount="indefinite"
          keyPoints="${i}" keyTimes="0;1" calcMode="linear">
          <mpath href="#${o}"/>
        </animateMotion>
      </circle>`)}return B`${r}${c}`}function Mt(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${s}" fill="none"
       stroke-width="3" stroke-linecap="round"
       style="filter: drop-shadow(0 0 5px ${s})">
      <circle cx="32" cy="32" r="12"/>
      <line x1="32" y1="6"  x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6"  y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13" y1="13" x2="19" y2="19"/>
      <line x1="45" y1="45" x2="51" y2="51"/>
      <line x1="13" y1="51" x2="19" y2="45"/>
      <line x1="45" y1="19" x2="51" y2="13"/>
    </g>`}function zt(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" fill="${s}"
       style="filter: drop-shadow(0 0 4px ${s})">
      <path d="M36 4 L14 36 L28 36 L24 60 L50 26 L34 26 Z"/>
    </g>`}function Lt(t,e,n,s,o=!1){return B`
    <g transform="translate(${t},${e}) scale(${n/24})" fill="${s}"
       style="filter: drop-shadow(0 0 4px ${s})">
      <path class="${o?"spin":""}" d="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z"/>
    </g>`}function jt(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/24})" fill="${s}"
       style="filter: drop-shadow(0 0 4px ${s})">
      <path d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"/>
    </g>`}function Ht(t,e,n,s,o){const r=o?.rowFromBottom??0,a=t.y+t.h-72-24-80*r,i=o?.zone?o.zone.x:t.x+14,l=((o?.zone?o.zone.w:t.w-28)-8*Math.max(0,e.length-1))/e.length;return B`${e.map((t,e)=>{const r=o?.itemStyle?.(t,e),c=r?.icon??o?.icon??zt,h=r?.iconColor??o?.iconColor??"rgba(226,240,248,0.75)",d=r?.borderColor??o?.borderColor??"rgba(120,180,210,0.16)",p=i+e*(l+8),_=p+l/2,m=kt($t(n,t.entity)),y=_-7,u=a+12;return B`
      <g class="phase-chip" @click=${e=>{e.stopPropagation(),s(t.entity)}}>
        <title>${t.label} · ${t.name}</title>
        <rect x="${p}" y="${a}" width="${l}" height="${72}" rx="10"
          fill="rgba(255,255,255,0.045)" stroke="${d}" stroke-width="1"/>
        ${c(y,u,14,h)}
        <text x="${_}" y="${a+38}" text-anchor="middle" class="chip-value">${m}</text>
        <text x="${_}" y="${a+56}" text-anchor="middle" class="chip-name">${t.name}</text>
      </g>`})}`}const Tt="fve-flow-confirm-dialog";class Ot extends HTMLElement{constructor(){super(),this._confirmed=!1;const t=this.attachShadow({mode:"open"});t.innerHTML='\n      <style>\n        :host {\n          --dialog-accent: #ffb74d;\n          color: var(--primary-text-color, #e6f4fa);\n          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);\n        }\n        dialog {\n          width: min(420px, calc(100vw - 32px));\n          padding: 0;\n          overflow: hidden;\n          color: inherit;\n          background:\n            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 45%),\n            rgba(7, 16, 25, 0.98);\n          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);\n          border-radius: 18px;\n          box-shadow: 0 0 28px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 20px 64px rgba(0, 0, 0, 0.55);\n        }\n        dialog::backdrop {\n          background: rgba(0, 7, 13, 0.76);\n          backdrop-filter: blur(5px);\n        }\n        .body {\n          padding: 22px 22px 18px;\n        }\n        h2 {\n          display: flex;\n          align-items: center;\n          gap: 10px;\n          margin: 0 0 10px;\n          font-size: 16px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n        }\n        h2::before {\n          content: \'\';\n          width: 9px;\n          height: 9px;\n          flex: 0 0 auto;\n          border-radius: 50%;\n          background: var(--dialog-accent);\n          box-shadow: 0 0 10px var(--dialog-accent);\n        }\n        p {\n          margin: 0;\n          color: var(--secondary-text-color, rgba(220, 235, 245, 0.68));\n          font-size: 14px;\n          line-height: 1.5;\n        }\n        .actions {\n          display: flex;\n          justify-content: flex-end;\n          gap: 10px;\n          padding: 0 22px 20px;\n        }\n        button {\n          padding: 9px 18px;\n          font: inherit;\n          font-size: 13.5px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n          cursor: pointer;\n          border-radius: 10px;\n        }\n        .cancel {\n          color: var(--secondary-text-color, #a8bbc6);\n          background: rgba(255, 255, 255, 0.05);\n          border: 1px solid rgba(255, 255, 255, 0.12);\n        }\n        .cancel:hover,\n        .cancel:focus-visible {\n          color: var(--primary-text-color, #fff);\n          outline: 1px solid rgba(255, 255, 255, 0.3);\n        }\n        .confirm {\n          color: #0a0f16;\n          background: var(--dialog-accent);\n          border: 1px solid var(--dialog-accent);\n          box-shadow: 0 0 14px color-mix(in srgb, var(--dialog-accent) 45%, transparent);\n        }\n        .confirm:hover,\n        .confirm:focus-visible {\n          filter: brightness(1.12);\n          outline: none;\n        }\n      </style>\n      <dialog aria-labelledby="confirm-title">\n        <div class="body">\n          <h2 id="confirm-title"></h2>\n          <p></p>\n        </div>\n        <div class="actions">\n          <button type="button" class="cancel">Zrušit</button>\n          <button type="button" class="confirm"></button>\n        </div>\n      </dialog>\n    ',this._dialog=t.querySelector("dialog"),t.querySelector(".cancel").addEventListener("click",()=>this._dialog.close()),t.querySelector(".confirm").addEventListener("click",()=>{this._confirmed=!0,this._dialog.close()}),this._dialog.addEventListener("click",t=>{t.target===this._dialog&&this._dialog.close()}),this._dialog.addEventListener("close",()=>{this._resolve?.(this._confirmed),this.remove()})}show(t){const e=this.shadowRoot;return e.querySelector("h2").textContent=t.title,e.querySelector("p").textContent=t.message,e.querySelector(".confirm").textContent=t.confirmLabel,t.accent&&this.style.setProperty("--dialog-accent",t.accent),this._dialog.showModal(),new Promise(t=>{this._resolve=t})}}customElements.get(Tt)||customElements.define(Tt,Ot);const Nt="fve-flow-history-dialog";class Vt extends HTMLElement{constructor(){super();const t=this.attachShadow({mode:"open"});t.innerHTML='\n      <style>\n        :host {\n          --dialog-accent: #4fc3f7;\n          color: var(--primary-text-color, #e6f4fa);\n          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);\n        }\n        dialog {\n          width: min(920px, calc(100vw - 32px));\n          max-width: 920px;\n          max-height: calc(100vh - 32px);\n          padding: 0;\n          overflow: hidden;\n          color: inherit;\n          background:\n            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 38%),\n            rgba(7, 16, 25, 0.98);\n          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);\n          border-radius: 20px;\n          box-shadow: 0 0 32px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 24px 80px rgba(0, 0, 0, 0.55);\n        }\n        dialog::backdrop {\n          background: rgba(0, 7, 13, 0.76);\n          backdrop-filter: blur(5px);\n        }\n        header {\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          min-height: 64px;\n          padding: 0 18px 0 22px;\n          border-bottom: 1px solid rgba(130, 190, 220, 0.12);\n        }\n        .accent {\n          width: 9px;\n          height: 9px;\n          flex: 0 0 auto;\n          border-radius: 50%;\n          background: var(--dialog-accent);\n          box-shadow: 0 0 10px var(--dialog-accent);\n        }\n        h2 {\n          min-width: 0;\n          flex: 1;\n          margin: 0;\n          overflow: hidden;\n          color: var(--primary-text-color, #e6f4fa);\n          font-size: 17px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n          text-overflow: ellipsis;\n          white-space: nowrap;\n        }\n        .range {\n          color: var(--secondary-text-color, rgba(220, 235, 245, 0.62));\n          font-size: 12px;\n          white-space: nowrap;\n        }\n        button {\n          display: grid;\n          width: 38px;\n          height: 38px;\n          padding: 0;\n          place-items: center;\n          color: var(--secondary-text-color, #a8bbc6);\n          font: inherit;\n          font-size: 25px;\n          line-height: 1;\n          cursor: pointer;\n          background: rgba(255, 255, 255, 0.05);\n          border: 1px solid rgba(255, 255, 255, 0.09);\n          border-radius: 50%;\n        }\n        button:hover,\n        button:focus-visible {\n          color: var(--primary-text-color, #fff);\n          outline: 1px solid var(--dialog-accent);\n        }\n        .chart {\n          min-height: 390px;\n          padding: 12px;\n          overflow: auto;\n        }\n        .chart > * {\n          display: block;\n          width: 100%;\n        }\n        @media (max-width: 600px) {\n          dialog {\n            width: calc(100vw - 16px);\n            max-height: calc(100vh - 16px);\n            border-radius: 16px;\n          }\n          header {\n            min-height: 58px;\n            padding: 0 10px 0 16px;\n          }\n          h2 {\n            font-size: 15px;\n          }\n          .range {\n            display: none;\n          }\n          .chart {\n            min-height: 320px;\n            padding: 8px;\n          }\n        }\n      </style>\n      <dialog aria-labelledby="history-title">\n        <header>\n          <span class="accent" aria-hidden="true"></span>\n          <h2 id="history-title"></h2>\n          <span class="range">posledních 48 hodin</span>\n          <button type="button" aria-label="Zavřít graf" title="Zavřít">×</button>\n        </header>\n        <div class="chart"></div>\n      </dialog>\n    ',this._dialog=t.querySelector("dialog"),this._chartHost=t.querySelector(".chart"),t.querySelector("button").addEventListener("click",()=>this._dialog.close()),this._dialog.addEventListener("click",t=>{t.target===this._dialog&&this._dialog.close()}),this._dialog.addEventListener("close",()=>this.remove())}show(t,e,n,s){this.shadowRoot.querySelector("h2").textContent=t,this.shadowRoot.querySelector(".range").textContent=e,this.style.setProperty("--dialog-accent",n),this._chartHost.replaceChildren(s),this._dialog.showModal()}}customElements.get(Nt)||customElements.define(Nt,Vt);const Ft={entity:{domain:"sensor"}},Ut={entity:{domain:"switch"}},Rt={text:{}},It={icon:{}},Dt={boolean:{}},Wt=(t,e,n=1)=>({number:{min:t,max:e,step:n,mode:"box"}}),Bt=[{name:"yellow_from",selector:Wt(0,2e4,50)},{name:"green_from",selector:Wt(0,2e4,50)},{name:"bar_max",selector:Wt(100,3e4,100)},{name:"severity_invert",selector:Dt}],Zt=[{name:"yellow_from",selector:Wt(0,100,1)},{name:"green_from",selector:Wt(0,100,1)}],qt=[{name:"title",selector:Rt},{name:"pv",type:"expandable",title:"FVE panely",icon:"mdi:solar-power",schema:[{name:"power",required:!0,selector:Ft},{name:"energy_today",selector:Ft},{name:"energy_total",selector:Ft},{name:"max_power_today",selector:Ft},{name:"name",selector:Rt,custom_label:"Vlastní název FVE panelů"},...Bt]},{name:"pv",type:"expandable",title:"MPPT regulátor",icon:"mdi:current-dc",schema:[{name:"voltage",selector:Ft},{name:"current",selector:Ft},{name:"mppt_state",selector:Ft},{name:"mppt_switch",selector:Ut},{name:"mppt_name",selector:Rt,custom_label:"Vlastní název MPPT regulátoru"}]},{name:"battery",type:"expandable",icon:"mdi:battery-high",schema:[{name:"soc",required:!0,selector:Ft},{name:"power",selector:Ft},{name:"voltage",selector:Ft},{name:"current",selector:Ft},{name:"temperature",selector:Ft},{name:"soh",selector:Ft},{name:"runtime",selector:Ft},{name:"cycles",selector:Ft},{name:"time_to_full",selector:Ft},{name:"capacity",selector:Ft},{name:"invert",selector:Dt},{name:"name",selector:Rt,custom_label:"Vlastní název baterie"},...Zt]},{name:"inverter",type:"expandable",icon:"mdi:sine-wave",schema:[{name:"power",selector:Ft},{name:"state",selector:Ft},{name:"voltage",selector:Ft},{name:"current",selector:Ft},{name:"load_power",selector:Ft},{name:"days_in_service",selector:Ft},{name:"fan_switch",selector:Ut},{name:"name",selector:Rt,custom_label:"Vlastní název měniče"},...Bt]},{name:"grid",type:"expandable",icon:"mdi:transmission-tower",schema:[{name:"power",selector:Ft},{name:"phase_a",selector:Ft},{name:"phase_b",selector:Ft},{name:"phase_c",selector:Ft},{name:"energy_total",selector:Ft},{name:"energy_today",selector:Ft},{name:"name",selector:Rt,custom_label:"Vlastní název sítě"},...Bt]},{name:"solcast",type:"expandable",icon:"mdi:weather-sunny",schema:[{name:"power_now",selector:Ft},{name:"remaining_today",selector:Ft},{name:"total_today",selector:Ft},{name:"total_tomorrow",selector:Ft},...Bt]},{name:"options",type:"expandable",icon:"mdi:tune",schema:[{name:"max_flow_w",selector:Wt(500,2e4,100)},{name:"deadband_w",selector:Wt(0,500,5)},{name:"dots",selector:Wt(1,8)},{name:"min_duration",selector:Wt(.5,10,.1)},{name:"max_duration",selector:Wt(1,20,.5)},{name:"animation",selector:Dt}]}],Gt=[{name:"name",required:!0,selector:Rt,custom_label:"Název patra"},{name:"floor_grid",type:"expandable",flatten:!0,expanded:!0,title:"Grid (síť) — Shelly *-GRID-AC-OUT",icon:"mdi:transmission-tower",schema:[{name:"grid_power",selector:Ft},{name:"grid_energy",selector:Ft},{name:"phase_a_entity",selector:Ft},{name:"phase_a_name",selector:Rt},{name:"phase_a_icon",selector:It},{name:"phase_b_entity",selector:Ft},{name:"phase_b_name",selector:Rt},{name:"phase_b_icon",selector:It},{name:"phase_c_entity",selector:Ft},{name:"phase_c_name",selector:Rt},{name:"phase_c_icon",selector:It}]},{name:"floor_fve",type:"expandable",flatten:!0,expanded:!0,title:"FVE (ostrov)",icon:"mdi:solar-power",schema:[{name:"island_power",selector:Ft},{name:"island_energy",selector:Ft}]}],Kt={title:"Titulek karty",pv:"FVE / MPPT",mppt_switch:"Spínač MPPT (switch) — ovládací tlačítko",fan_switch:"Spínač chlazení měniče (switch) — ovládací tlačítko",battery:"Baterie",inverter:"Měnič",grid:"Síť (grid)",solcast:"Předpověď Solcast",options:"Chování a animace",power:"Výkon (W)",energy_today:"Energie dnes (kWh)",energy_total:"Energie celkem (kWh)",max_power_today:"Maximální výkon dnes (W)",voltage:"Napětí (V)",current:"Proud (A)",mppt_state:"Režim / stav MPPT",soc:"Nabití SoC (%)",temperature:"Teplota",soh:"Zdraví SoH (%)",runtime:"Odhadovaná výdrž",cycles:"Počet nabíjecích cyklů",time_to_full:"Doba do plného nabití",capacity:"Instalovaná kapacita",invert:"Obrátit znaménko výkonu baterie",state:"Stav měniče",load_power:"Ostrovní spotřeba — kritické zátěže (W)",days_in_service:"Počet dní v provozu",name:"Vlastní název",phase_a:"Fáze L1",phase_b:"Fáze L2",phase_c:"Fáze L3",phase_a_entity:"Entita výkonu L1 (W)",phase_a_name:"Vlastní název L1 (např. Pračka)",phase_a_icon:"Ikona L1",phase_b_entity:"Entita výkonu L2 (W)",phase_b_name:"Vlastní název L2 (např. Sušička)",phase_b_icon:"Ikona L2",phase_c_entity:"Entita výkonu L3 (W)",phase_c_name:"Vlastní název L3 (např. Sporák)",phase_c_icon:"Ikona L3",power_now:"Predikovaný výkon teď (W)",remaining_today:"Zbývá dnes (kWh)",total_today:"Dnes celkem (kWh)",total_tomorrow:"Zítra celkem (kWh)",max_flow_w:"Výkon pro plnou rychlost animace (W)",deadband_w:"Mrtvá zóna — pod tímto výkonem je linka neaktivní (W)",dots:"Počet svítících teček na jedné aktivní lince",min_duration:"Nejrychlejší oběh tečky — při max. výkonu (s)",max_duration:"Nejpomalejší oběh tečky — těsně nad mrtvou zónou (s)",animation:"Animace pulzujících teček zapnuté",yellow_from:"Žlutá od hodnoty (pod ní červená)",green_from:"Zelená od hodnoty",bar_max:"Rozsah progress baru (max)",severity_invert:"Obrátit barvy (vysoká hodnota = špatná)",grid_power:"Výkon ze sítě (W) — nepovinné, jinak součet fází",grid_energy:"Energie ze sítě (kWh)",island_power:"Výkon z FVE (W)",island_energy:"Energie z FVE (kWh)"},Jt={mppt_switch:"Když je vyplněno, zobrazí se v panelu MPPT tlačítko Zapnout/Vypnout. Přepnutí je chráněné potvrzovacím dialogem.",fan_switch:"Když je vyplněno, zobrazí se v panelu měniče tlačítko Zapnout/Vypnout chlazení (např. chytrá zásuvka s ventilátorem). Přepíná se okamžitě bez potvrzení.",max_flow_w:'Výkon, při kterém pulzy na lince běží nejrychleji (rychlost je od "mrtvé zóny" po tuto hodnotu plynulá). Nastav podle reálné špičky tvého systému, např. 5000 W pro měnič 5 kW.',deadband_w:'Pod touto hodnotou je tok energie tak malý, že se linka vykreslí jako klidná/šedá bez pulzů — potlačí to "věčné" mihotání kvůli šumu měření.',dots:'Kolik světelných teček se najednou pohybuje po jedné aktivní lince. Víc teček = hustší, "plnější" tok při vysokém výkonu.',min_duration:"Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon na hraně `max_flow_w` (nejrychlejší možný pohyb).",max_duration:'Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon jen kousek nad `deadband_w` (nejpomalejší, "sotva tekoucí" pohyb).',animation:"Vypnutím se pulzující tečky nekreslí vůbec — čísla, barvy a stavy uzlů se ale dál aktualizují normálně. Vhodné na slabší zařízení nebo pokud animace nechceš."};let Yt=class extends ct{constructor(){super(...arguments),this._computeLabel=t=>t.custom_label??Kt[t.name]??t.name,this._computeHelper=t=>Jt[t.name]}setConfig(t){this._config=t}render(){if(!this.hass||!this._config)return W``;const t=this._config.floors??[];return W`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${qt}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        @value-changed=${this._mainChanged}
      ></ha-form>

      <div class="floors-header">
        <span>Patra (${t.length})</span>
        <button class="add" @click=${this._addFloor}>+ Přidat patro</button>
      </div>

      ${t.map((t,e)=>W`
          <ha-expansion-panel outlined>
            <div slot="header" class="floor-header">
              <span>${t.name||`Patro ${e+1}`}</span>
              <button
                class="remove"
                title="Odebrat patro"
                @click=${t=>{t.stopPropagation(),this._removeFloor(e)}}
              >
                ✕
              </button>
            </div>
            <div class="floor-body">
              <ha-form
                .hass=${this.hass}
                .data=${t}
                .schema=${Gt}
                .computeLabel=${this._computeLabel}
                .computeHelper=${this._computeHelper}
                @value-changed=${t=>this._floorChanged(t,e)}
              ></ha-form>
            </div>
          </ha-expansion-panel>
        `)}
      ${t.length?q:W`<div class="hint">
            Zatím žádná patra — přidej první přes tlačítko výše. Každé patro může mít grid větev
            (Shelly *-GRID-AC-OUT), FVE větev a pojmenované fáze.
          </div>`}
    `}_mainChanged(t){t.stopPropagation();const e=t.detail.value;this._emit({...e,floors:this._config?.floors??[]})}_floorChanged(t,e){t.stopPropagation();const n=[...this._config?.floors??[]];n[e]=t.detail.value,this._emit({...this._config,floors:n})}_addFloor(){const t=[...this._config?.floors??[],{name:`Patro ${(this._config?.floors?.length??0)+1}`}];this._emit({...this._config,floors:t})}_removeFloor(t){const e=(this._config?.floors??[]).filter((e,n)=>n!==t);this._emit({...this._config,floors:e})}_emit(t){this._config=t,St(this,"config-changed",{config:t})}};Yt.styles=a`
    :host {
      display: block;
    }
    ha-form {
      display: block;
      margin-bottom: 16px;
    }
    .floors-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 0 12px;
      font-weight: 600;
    }
    .floors-header .add {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    ha-expansion-panel {
      display: block;
      margin-bottom: 8px;
    }
    .floor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-right: 8px;
    }
    .floor-header .remove {
      background: transparent;
      border: 1px solid var(--divider-color, #444);
      color: var(--secondary-text-color);
      border-radius: 6px;
      padding: 2px 8px;
      cursor: pointer;
    }
    .floor-header .remove:hover {
      color: var(--error-color, #f44336);
      border-color: var(--error-color, #f44336);
    }
    .floor-body {
      padding: 12px;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 13px;
      padding: 8px 4px;
    }
  `,t([mt({attribute:!1})],Yt.prototype,"hass",void 0),t([yt()],Yt.prototype,"_config",void 0),Yt=t([dt("fve-flow-card-editor")],Yt);const Qt="#00e676",Xt="#00e676",te="#4fc3f7",ee="#e040fb",ne="#ffb74d",se="#69f0ae",oe="#ffb74d",re={L1:{color:"#f5f5f5",border:"rgba(245,245,245,0.28)"},L2:{color:"#78909c",border:"rgba(120,144,156,0.35)"},L3:{color:"#b87333",border:"rgba(184,115,51,0.38)"}};console.info("%c FVE-FLOW-CARD %c v0.3.0 ","color: #0a0f16; background: #00e676; font-weight: 700;","color: #00e676; background: #0a0f16; font-weight: 700;");let ae=class extends ct{setConfig(t){if(!t)throw new Error("Chybí konfigurace");this._config=t}getCardSize(){return 12}getGridOptions(){return{columns:"full",rows:8,min_rows:4}}static async getConfigElement(){return document.createElement("fve-flow-card-editor")}static getStubConfig(){return{title:"Tok energie",pv:{power:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky",energy_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynos_dnes",energy_total:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_celkovy_vynos",max_power_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_maximalni_vykon_dnes",voltage:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_napeti_fv_sbernice",current:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_proud_dc_bateriove_sbernice",mppt_state:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_provozni_rezim_mppt"},battery:{soc:"sensor.pylontech_battery_id_512_nabijeni",power:"sensor.pylontech_battery_id_512_vykon",voltage:"sensor.pylontech_battery_id_512_napeti_dc_sbernice",current:"sensor.pylontech_battery_id_512_proud_dc_sbernice",temperature:"sensor.pylontech_battery_id_512_teplota",soh:"sensor.pylontech_battery_id_512_zdravi",runtime:"sensor.baterie_odhadovana_vydrz_2",time_to_full:"sensor.baterie_doba_do_plneho_nabiti",capacity:"sensor.pylontech_battery_id_512_instalovana_kapacita"},inverter:{power:"sensor.multiplus_ii_48_5000_70_50_id_275_vystupni_vykon_l1",state:"sensor.multiplus_ii_48_5000_70_50_id_275_stav",load_power:"sensor.gx_device_kriticke_zateze_na_l1",days_in_service:"sensor.fve_pocet_dni_v_provozu",name:"MultiPlus-II"},grid:{power:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_vykon",phase_a:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_a_vykon",phase_b:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_b_vykon",phase_c:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_c_vykon",energy_total:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_in_energie",name:"Síť ČEZ"},solcast:{power_now:"sensor.solcast_pv_forecast_power_now",remaining_today:"sensor.solcast_pv_forecast_forecast_remaining_today",total_today:"sensor.solcast_pv_forecast_forecast_today",total_tomorrow:"sensor.solcast_pv_forecast_forecast_tomorrow"},floors:[{name:"0NP",grid_energy:"sensor.0np_pradelna_dub_0np_grid_ac_out_energie",phase_a_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_c_vykon"},{name:"1NP",grid_energy:"sensor.dub_1np_grid_ac_out_energie",phase_a_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_c_vykon"}]}}_flowBase(){const t=this._config?.options??{};return{deadband:t.deadband_w??25,maxPower:t.max_flow_w??5e3,minDuration:t.min_duration??1.4,maxDuration:t.max_duration??6,dots:t.dots??3,animate:!1!==t.animation}}_entityName(t,e){const n=this.hass?.states[t]?.attributes.friendly_name;return e||("string"==typeof n?n:t)}_historySeries(t,e,n){return t?[{entity:t,name:e,color:n}]:[]}async _openHistory(t,e,n,s){if(!this.hass||!t.length)return;const o=await async function(t){if(!t.series.length)return!1;try{if(customElements.get("apexcharts-card")||await Promise.race([customElements.whenDefined("apexcharts-card"),new Promise(t=>window.setTimeout(t,1500))]),!customElements.get("apexcharts-card"))return console.warn("[FVE Flow Card] apexcharts-card není zaregistrovaná."),!1;const e={type:"custom:apexcharts-card",graph_span:"48h",...t.spanOffset?{span:{offset:t.spanOffset}}:{},update_interval:"1min",header:{show:!1},now:{show:!0,label:"Nyní"},apex_config:{chart:{height:360,background:"transparent",animations:{enabled:!0,easing:"easeinout",speed:500}},legend:{show:t.series.length>1,position:"top",horizontalAlign:"left"},grid:{borderColor:"rgba(148, 170, 190, 0.12)"},tooltip:{shared:!0,intersect:!1}},series:t.series.map(t=>({entity:t.entity,name:t.name,color:t.color,type:"area",curve:"smooth",stroke_width:2,stroke_dash:t.strokeDash??0,opacity:t.opacity??.22,extend_to:t.extendTo??"end",...t.dataGenerator?{data_generator:t.dataGenerator}:{fill_raw:t.fill??"last",group_by:{func:"avg",duration:"5min",fill:t.fill??"last"}},show:{extremas:!0,in_header:!1}}))},n=document.createElement("apexcharts-card");if("function"!=typeof n.setConfig)return!1;n.setConfig(e),n.hass=t.hass,n.style.setProperty("--ha-card-background","transparent"),n.style.setProperty("--card-background-color","transparent"),n.style.setProperty("--ha-card-box-shadow","none");const s=document.createElement(Nt);return document.body.append(s),s.show(t.title,t.rangeLabel||"posledních 48 hodin",t.series[0].color,n),!0}catch(t){return console.warn("[FVE Flow Card] Nepodařilo se otevřít 48h graf, používám nativní historii.",t),!1}}({hass:this.hass,title:e,series:t,spanOffset:n,rangeLabel:s});o||Pt(this,t[0].entity)}_openEntity(t,e,n){t&&this._openHistory(this._historySeries(t,this._entityName(t,e),n),e)}_openSolcastHistory(t){if(!t.power_now)return;const e=[t.total_today,t.total_tomorrow].filter(t=>!!t);if(!e.length)return void this._openEntity(t.power_now,"Předpověď Solcast","#ffd54f");const n=`\n      const entityIds = ${JSON.stringify(e)};\n      const now = Date.now();\n      const forecastEnd = now + 24 * 60 * 60 * 1000;\n      return entityIds\n        .flatMap((entityId) => {\n          const forecastEntity = hass.states[entityId];\n          return forecastEntity && Array.isArray(forecastEntity.attributes.detailedForecast)\n            ? forecastEntity.attributes.detailedForecast\n            : [];\n        })\n        .map((item) => {\n          const timestamp = new Date(item.period_start).getTime();\n          const watts = Number(item.pv_estimate) * 1000;\n          return [timestamp, watts];\n        })\n        .filter(([timestamp, watts]) =>\n          timestamp >= now - 30 * 60 * 1000 &&\n          timestamp <= forecastEnd &&\n          Number.isFinite(watts)\n        )\n        .map(([timestamp, watts]) => [Math.max(timestamp, now), watts]);\n    `;this._openHistory([{entity:t.power_now,name:"Skutečnost",color:"#4fc3f7",opacity:.18,extendTo:"now",fill:"null"},{entity:e[0],name:"Predikce",color:"#ffd54f",dataGenerator:n,strokeDash:5,opacity:.12,extendTo:!1}],"Solcast · skutečnost a predikce","+24h","24 h historie · 24 h predikce")}_openFloorHistory(t,e){const n=`${t.name||"Patro"} · výkon`,s=[];t.grid_power?s.push({entity:t.grid_power,name:"Síť",color:te}):e.forEach(t=>{s.push({entity:t.entity,name:t.name||t.label,color:re[t.label]?.color??te})}),t.island_power&&s.push({entity:t.island_power,name:"FVE",color:Xt}),this._openHistory(s,n)}_gridPhases(t){return[[t.phase_a,"L1"],[t.phase_b,"L2"],[t.phase_c,"L3"]].filter(([t])=>!!t).map(([t,e])=>({entity:t,name:e,icon:"mdi:flash",label:e}))}_phases(t){const e=[],n=[[t.phase_a_entity,t.phase_a_name,t.phase_a_icon,"L1"],[t.phase_b_entity,t.phase_b_name,t.phase_b_icon,"L2"],[t.phase_c_entity,t.phase_c_name,t.phase_c_icon,"L3"]];for(const[t,s,o,r]of n)t&&e.push({entity:t,name:s||r,icon:o||"mdi:flash",label:r});return e}_switchOn(t){return"on"===this.hass?.states[t]?.state}_toggleSwitch(t){this.hass?.callService?.("switch",this._switchOn(t)?"turn_off":"turn_on",{entity_id:t})}async _toggleSwitchConfirmed(t,e){const n=this._switchOn(t);await function(t){const e=document.createElement(Tt);return document.body.append(e),e.show(t)}({title:n?`Vypnout ${e}?`:`Zapnout ${e}?`,message:n?`Regulátor se odpojí a přestane nabíjet z FVE. Opravdu chceš ${e} vypnout?`:`Regulátor se připojí a začne nabíjet z FVE. Opravdu chceš ${e} zapnout?`,confirmLabel:n?"Vypnout":"Zapnout",accent:n?oe:se})&&this._toggleSwitch(t)}_controlChip(t,e,n,s,o,r){const a=this._switchOn(n),i=a?"#26c6da":"rgba(148,170,190,0.55)";return B`
      <g class="ctrl-chip" @click=${t=>{t.stopPropagation(),r()}}>
        <title>${s} · ${a?"zapnuto":"vypnuto"}</title>
        <rect x="${t}" y="${e}" width="${96}" height="${30}" rx="9"
          fill="rgba(255,255,255,0.05)" stroke="${i}" stroke-opacity="${a?.7:.35}"
          stroke-width="1" style="${a?`filter: drop-shadow(0 0 6px ${i}60)`:""}"/>
        ${o(t+9,e+8,14,i,a)}
        <text class="ctrl-label" x="${t+30}" y="${e+19.5}" style="fill: ${a?"#bfeef5":"rgba(226,240,248,0.6)"}">
          ${a?"Vypnout":"Zapnout"}
        </text>
      </g>`}_floorGridPower(t){return t.grid_power&&xt(this.hass,t.grid_power)?$t(this.hass,t.grid_power):this._phases(t).reduce((t,e)=>t+$t(this.hass,e.entity),0)}render(){const t=this._config;if(!t)return W``;if(!this.hass)return W`<ha-card></ha-card>`;const e=t.floors??[],n=function(t){const e=Math.max(1,t),n={x:50,y:40,w:300,h:190},s={x:50,y:280,w:300,h:150},o={x:50,y:480,w:300,h:320},r=Math.round(519),a={x:r,y:360,w:280,h:260},i={x:r,y:40,w:280,h:190},l={x:ut,y:40,w:380,h:210},c=[];for(let t=0;t<e;t++)c.push({x:ut,y:280+200*t,w:380,h:170});const h=c[c.length-1].y+170,d=n.x+n.w/2,p=a.y+a.h/2,_=l.y+l.h/2,m={pvMppt:`M ${d} ${n.y+n.h} L ${d} ${s.y}`,pvSolcast:`M ${n.x+n.w} ${n.y+n.h/2} H ${i.x}`,mpptInv:`M ${s.x+s.w} ${s.y+s.h/2} H ${a.x-80} V ${a.y+50} H ${a.x}`,batInv:`M ${o.x+o.w} ${o.y+150} H ${a.x-40} V ${a.y+120} H ${a.x}`,islandTaps:c.map(t=>{const e=t.y+t.h/2;return`M ${a.x+a.w} ${p} H 928 V ${e} H ${t.x}`}),gridTaps:c.map(t=>{const e=t.y+t.h/2;return`M ${l.x+l.w} ${_} H 1388 V ${e} H ${t.x+t.w}`})};return{width:1440,height:Math.max(820,h+40),pv:n,mppt:s,battery:o,inverter:a,solcast:i,grid:l,floors:c,paths:m}}(Math.max(1,e.length)),s=this._flowBase(),o=$t(this.hass,t.pv?.power),r=$t(this.hass,t.battery?.power),a=t.battery?.invert?-r:r,i=a>=s.deadband,l=a<=-s.deadband,c=xt(this.hass,t.inverter?.load_power)?$t(this.hass,t.inverter?.load_power):$t(this.hass,t.inverter?.power),h=xt(this.hass,t.grid?.power)?$t(this.hass,t.grid?.power):e.reduce((t,e)=>t+this._floorGridPower(e),0),d=(t,e,n)=>Ct(t,e,{...s,reverse:!1,hidden:!1,...n});return W`
      <ha-card>
        <svg
          viewBox="0 0 ${n.width} ${n.height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
        >
          ${t.title?B`<text class="card-title" x="${n.width/2}" y="26" text-anchor="middle">${t.title}</text>`:q}

          <!-- Toky (pod uzly) -->
          ${t.solcast?.power_now||t.solcast?.remaining_today||t.solcast?.total_today||t.solcast?.total_tomorrow?B`<path d="${n.paths.pvSolcast}" fill="none" stroke="#ffd54f"
                stroke-opacity="0.3" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round"/>`:q}
          ${d("pv-mppt",n.paths.pvMppt,{power:o,color:Qt,hidden:!t.pv?.power})}
          ${d("mppt-inv",n.paths.mpptInv,{power:o,color:Qt,hidden:!t.pv?.power})}
          ${d("bat-inv",n.paths.batInv,{power:a,color:i?ee:ne,reverse:i,hidden:!t.battery?.power})}
          ${n.paths.islandTaps.map((t,n)=>{const s=e[n],o=s?.island_power&&xt(this.hass,s.island_power)?$t(this.hass,s.island_power):c;return d(`island-${n}`,t,{power:o,color:Xt})})}
          ${n.paths.gridTaps.map((t,n)=>{const s=e[n];return d(`grid-${n}`,t,{power:s?this._floorGridPower(s):0,color:te})})}

          <!-- Uzly -->
          ${this._nodePv(n.pv)}
          ${this._nodeMppt(n.mppt)}
          ${this._nodeBattery(n.battery,a,i,l)}
          ${this._nodeInverter(n.inverter,c)}
          ${this._nodeSolcast(n.solcast)}
          ${this._nodeGrid(n.grid,h)}
          ${n.floors.map((t,n)=>e[n]?this._nodeFloor(t,e[n]):q)}
        </svg>
      </ha-card>
    `}_panel(t,e,n=!0){return B`
      <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="rgba(14, 24, 34, 0.72)"
        stroke="${e}" stroke-opacity="${n?.5:.18}" stroke-width="1.5"
        style="${n?`filter: drop-shadow(0 0 10px ${e}40)`:""}"/>`}_bar(t,e,n,s){const o=t.w-40,r=Math.max(0,Math.min(1,Math.abs(e)/Math.max(1,n))),a=t.y+t.h-12;return B`
      <rect x="${t.x+20}" y="${a}" width="${o}" height="4" rx="2"
        fill="rgba(255,255,255,0.08)"/>
      ${r>0?B`<rect x="${t.x+20}" y="${a}" width="${Math.max(4,o*r)}" height="4" rx="2"
            fill="${s}" style="filter: drop-shadow(0 0 4px ${s})"/>`:q}`}_hit(t,e){return e?B`
      <rect class="hit" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="transparent" @click=${e}>
        <title>Zobrazit graf za 48 hodin</title>
      </rect>`:q}_nodePv(t){const e=this._config?.pv??{},n=$t(this.hass,e.power),s=Math.abs(n)>=this._flowBase().deadband,o=gt(n,e),r=o??Qt;return B`
      ${this._panel(t,r,s)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${e.name||"FVE panely"}</text>
      ${function(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${s}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${s})">
      <path d="M14 8 L58 8 L50 44 L6 44 Z"/>
      <line x1="28" y1="8" x2="21" y2="44"/>
      <line x1="43" y1="8" x2="36" y2="44"/>
      <line x1="11" y1="26" x2="54" y2="26"/>
      <line x1="28" y1="44" x2="28" y2="56"/>
      <line x1="18" y1="56" x2="38" y2="56"/>
    </g>`}(t.x+18,t.y+46,60,s?r:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${r}">${e.power?kt(n):"—"}</text>
      ${o?this._bar(t,n,e.bar_max??this._flowBase().maxPower,o):q}
      <text class="small" x="${t.x+90}" y="${t.y+112}">
        Dnes <tspan class="strong">${e.energy_today?Et($t(this.hass,e.energy_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+134}">
        Špička dnes <tspan class="strong">${e.max_power_today?kt($t(this.hass,e.max_power_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+156}">
        Celkem <tspan class="strong">${e.energy_total?Et($t(this.hass,e.energy_total)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power?()=>this._openEntity(e.power,e.name||"FVE panely",r):void 0)}
    `}_nodeMppt(t){const e=this._config?.pv??{},n=At(this.hass,e.mppt_state),s=e.mppt_state?this.hass?.states[e.mppt_state]?.state.trim().toLowerCase():void 0,o=!!s&&!["off","vypnuto","unknown","unavailable"].includes(s);return B`
      ${this._panel(t,Qt,o)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${e.mppt_name||"MPPT regulátor"}</text>
      ${function(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${s}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${s})">
      <rect x="8" y="12" width="48" height="40" rx="6"/>
      <path d="M16 40 L26 40 L32 24 L38 40 L48 40"/>
      <line x1="24" y1="52" x2="24" y2="58"/>
      <line x1="40" y1="52" x2="40" y2="58"/>
    </g>`}(t.x+18,t.y+44,48,o?Qt:"rgba(148,170,190,0.5)")}
      <text class="medium" x="${t.x+80}" y="${t.y+66}">${n}</text>
      <text class="small" x="${t.x+80}" y="${t.y+92}">
        Napětí <tspan class="strong">${e.voltage?At(this.hass,e.voltage):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+80}" y="${t.y+114}">
        Proud <tspan class="strong">${e.current?At(this.hass,e.current):"—"}</tspan>
      </text>
      ${this._hit(t,e.mppt_state||e.voltage?()=>Pt(this,e.mppt_state??e.voltage):void 0)}
      ${e.mppt_switch?this._controlChip(t.x+t.w-110,t.y+12,e.mppt_switch,e.mppt_name||"MPPT regulátor",jt,()=>{this._toggleSwitchConfirmed(e.mppt_switch,e.mppt_name||"MPPT regulátor")}):q}
    `}_nodeBattery(t,e,n,s){const o=this._config?.battery??{},r=$t(this.hass,o.soc,0),a=gt(r,{yellow_from:o.yellow_from??15,green_from:o.green_from??40,severity_invert:o.severity_invert}),i=n?`▲ nabíjení ${kt(Math.abs(e))}`:s?`▼ vybíjení ${kt(Math.abs(e))}`:"● klidový stav",l=n?ee:s?ne:"rgba(220,235,245,0.55)";return B`
      ${this._panel(t,a,!0)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${o.name||"Baterie Pylontech"}</text>
      ${function(t,e,n,s,o,r){const a=.4*n,i=s-12,l=Math.max(0,Math.min(1,o/100))*i;return B`
    <g style="filter: drop-shadow(0 0 6px ${r})">
      <rect x="${t+(n-a)/2}" y="${e-10}" width="${a}" height="${14}" rx="3"
        fill="none" stroke="${r}" stroke-width="3"/>
      <rect x="${t}" y="${e}" width="${n}" height="${s}" rx="10"
        fill="rgba(0,0,0,0.35)" stroke="${r}" stroke-width="3"/>
      <rect x="${t+6}" y="${e+6+(i-l)}" width="${n-12}" height="${l}" rx="5"
        fill="${r}" opacity="0.85"/>
    </g>`}(t.x+30,t.y+62,58,168,r,a)}
      <text class="tiny" x="${t.x+59}" y="${t.y+252}" text-anchor="middle">
        ${o.capacity?At(this.hass,o.capacity):""}
      </text>
      <text class="big" x="${t.x+118}" y="${t.y+90}" style="fill: ${a}">${o.soc?`${Math.round(r)} %`:"—"}</text>
      <text class="medium" x="${t.x+118}" y="${t.y+122}" style="fill: ${l}">${o.power?i:""}</text>
      <text class="small" x="${t.x+118}" y="${t.y+152}">
        Napětí <tspan class="strong">${o.voltage?At(this.hass,o.voltage):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+174}">
        Proud <tspan class="strong">${o.current?At(this.hass,o.current):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+196}">
        Teplota <tspan class="strong">${o.temperature?At(this.hass,o.temperature):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+218}">
        ${o.soh?`SoH ${At(this.hass,o.soh)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+242}">
        ${o.runtime?`Výdrž ${At(this.hass,o.runtime)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+262}">
        ${o.cycles?`Počet cyklů ${At(this.hass,o.cycles)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+282}">
        ${n&&o.time_to_full?`Do nabití ${At(this.hass,o.time_to_full)}`:""}
      </text>
      ${this._hit(t,o.soc?()=>this._openEntity(o.soc,`${o.name||"Baterie Pylontech"} · SoC`,a):void 0)}
    `}_nodeInverter(t,e){const n=this._config?.inverter??{},s=xt(this.hass,n.power)?$t(this.hass,n.power):e,o=At(this.hass,n.state),r=Math.abs(s)>=this._flowBase().deadband||"—"!==o,a=gt(s,n),i=a??Xt;return B`
      ${this._panel(t,i,r)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${n.name||"Měnič MultiPlus-II"}</text>
      ${function(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${s}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${s})">
      <rect x="6" y="6" width="52" height="52" rx="10"/>
      <path d="M20 26 A 14 14 0 0 1 44 26" />
      <path d="M44 26 l 1 -8 m -1 8 l -8 -1"/>
      <path d="M44 38 A 14 14 0 0 1 20 38" />
      <path d="M20 38 l -1 8 m 1 -8 l 8 1"/>
    </g>`}(t.x+18,t.y+46,56,r?i:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${i}">${kt(s)}</text>
      <circle cx="${t.x+96}" cy="${t.y+106}" r="4" fill="${"—"!==o?se:"rgba(148,170,190,0.4)"}"/>
      <text class="small" x="${t.x+108}" y="${t.y+111}">${o}</text>
      ${n.voltage?B`<text class="small" x="${t.x+90}" y="${t.y+138}">
            Napětí <tspan class="strong">${At(this.hass,n.voltage)}</tspan>
          </text>`:q}
      ${n.current?B`<text class="small" x="${t.x+90}" y="${t.y+160}">
            Proud <tspan class="strong">${At(this.hass,n.current)}</tspan>
          </text>`:q}
      ${n.load_power?B`<text class="tiny" x="${t.x+90}" y="${t.y+184}">
            Kritické zátěže ${kt($t(this.hass,n.load_power))}
          </text>`:q}
      ${a?this._bar(t,s,n.bar_max??this._flowBase().maxPower,a):q}
      ${n.days_in_service?B`<text class="tiny" x="${t.x+20}" y="${t.y+t.h-20}">
            Počet dní v provozu <tspan class="strong">${At(this.hass,n.days_in_service)}</tspan>
          </text>`:q}
      ${this._hit(t,n.power||n.load_power?()=>this._openEntity(n.power??n.load_power,n.name||"Měnič MultiPlus-II",i):void 0)}
      ${n.fan_switch?this._controlChip(t.x+t.w-110,t.y+t.h-52,n.fan_switch,"Chlazení",Lt,()=>this._toggleSwitch(n.fan_switch)):q}
    `}_nodeSolcast(t){const e=this._config?.solcast;if(!e||!e.power_now&&!e.remaining_today&&!e.total_today&&!e.total_tomorrow)return q;const n=$t(this.hass,e.power_now),s=gt(n,e),o=s??"#ffd54f",r=Math.abs(n)>=this._flowBase().deadband;return B`
      ${this._panel(t,o,r)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">Předpověď Solcast</text>
      ${Mt(t.x+16,t.y+58,56,r?o:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${o}">
        ${e.power_now?kt(n):"—"}
      </text>
      ${s?this._bar(t,n,e.bar_max??this._flowBase().maxPower,s):q}
      <text class="small" x="${t.x+90}" y="${t.y+112}">
        Zbývá dnes <tspan class="strong">${e.remaining_today?Et($t(this.hass,e.remaining_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+134}">
        Dnes celkem <tspan class="strong">${e.total_today?Et($t(this.hass,e.total_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+156}">
        Zítra celkem <tspan class="strong">${e.total_tomorrow?Et($t(this.hass,e.total_tomorrow)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power_now?()=>this._openSolcastHistory(e):void 0)}
    `}_nodeGrid(t,e){const n=this._config?.grid??{},s=Math.abs(e)>=this._flowBase().deadband,o=this._gridPhases(n),r=gt(e,n),a=r??te;return B`
      ${this._panel(t,a,s)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${n.name||"Síť ČEZ"}</text>
      ${function(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${s}" fill="none"
       stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${s})">
      <path d="M22 58 L28 12 L36 12 L42 58"/>
      <line x1="14" y1="20" x2="50" y2="20"/>
      <line x1="10" y1="32" x2="54" y2="32"/>
      <line x1="27" y1="20" x2="37" y2="32"/>
      <line x1="37" y1="20" x2="27" y2="32"/>
      <line x1="14" y1="20" x2="18" y2="28"/>
      <line x1="50" y1="20" x2="46" y2="28"/>
      <line x1="25" y1="44" x2="39" y2="44"/>
      <line x1="25" y1="44" x2="34" y2="58"/>
      <line x1="39" y1="44" x2="30" y2="58"/>
    </g>`}(t.x+16,t.y+44,52,s?a:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${a}">${kt(e)}</text>
      ${r?this._bar(t,e,n.bar_max??this._flowBase().maxPower,r):q}
      <text class="tiny" x="${t.x+90}" y="${t.y+108}">
        ${n.energy_total?`Celkem ze sítě ${Et($t(this.hass,n.energy_total))}`:""}
        ${n.energy_today?` · dnes ${Et($t(this.hass,n.energy_today))}`:""}
      </text>
      ${this._hit(t,n.power?()=>this._openEntity(n.power,n.name||"Síť",a):void 0)}
      ${o.length?Ht(t,o,this.hass,t=>{const e=o.find(e=>e.entity===t);this._openEntity(t,this._entityName(t),e?re[e.label]?.color??te:te)},{itemStyle:t=>({iconColor:re[t.label]?.color??te,borderColor:re[t.label]?.border})}):q}
    `}_nodeFloor(t,e){const n=this._floorGridPower(e),s=!!e.island_power&&xt(this.hass,e.island_power),o=s?$t(this.hass,e.island_power):0,r=this._phases(e),a=Math.abs(n)>=this._flowBase().deadband||s&&Math.abs(o)>=this._flowBase().deadband,i=s&&o>n?Xt:te,l=s?[{entity:e.island_power,name:"FVE výroba",icon:"mdi:solar-power",label:"FVE"}]:[],c=r,h=(t,n)=>{const s=[...l,...c].find(e=>e.entity===t);this._openEntity(t,s?`${e.name||"Patro"} · ${s.name}`:this._entityName(t),n?Xt:s?re[s.label]?.color??te:te)},d={icon:Mt,iconColor:Xt,borderColor:"rgba(0,230,118,0.22)"},p=l.length>0&&c.length>0,_=t.w-28-(p?24:0),m=l.length+c.length,y=p?_*l.length/m:_,u={x:t.x+14,w:y},f=p?{x:t.x+14+y+24,w:_-y}:{x:t.x+14,w:_},g=t.y+t.h-72-24,$=t.x+14+y+12;return B`
      ${this._panel(t,i,a)}
      ${function(t,e,n,s){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${s}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${s})">
      <path d="M8 32 L32 10 L56 32"/>
      <path d="M14 28 L14 56 L50 56 L50 28"/>
      <path d="M26 56 L26 40 L38 40 L38 56"/>
    </g>`}(t.x+16,t.y+12,30,i)}
      <text class="floor-name" x="${t.x+54}" y="${t.y+34}">${e.name??"Patro"}</text>
      <text class="floor-val" x="${t.x+t.w-20}" y="${t.y+32}" text-anchor="end">
        <tspan class="dim">síť </tspan><tspan class="val-grid strong">${kt(n)}</tspan>
      </text>
      <text class="tiny" x="${t.x+54}" y="${t.y+56}">
        ${e.grid_energy?`Celkem ze sítě ${Et($t(this.hass,e.grid_energy))}`:""}
        ${e.island_energy?` · z fve ${Et($t(this.hass,e.island_energy))}`:""}
      </text>
      ${this._hit({x:t.x,y:t.y,w:t.w,h:64},e.grid_power||e.island_power||r.length?()=>this._openFloorHistory(e,r):void 0)}
      ${p?B`<line x1="${$}" y1="${g-4}" x2="${$}" y2="${g+76}"
            stroke="rgba(148,170,190,0.18)" stroke-width="1"/>`:q}
      ${l.length?Ht(t,l,this.hass,t=>h(t,!0),{itemStyle:()=>d,zone:u}):q}
      ${c.length?Ht(t,c,this.hass,t=>h(t,!1),{itemStyle:t=>({iconColor:re[t.label]?.color??te,borderColor:re[t.label]?.border}),zone:f}):q}
    `}};ae.styles=a`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      height: 100%;
      overflow: hidden;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(1100px 700px at 18% -10%, #122433 0%, transparent 60%),
        radial-gradient(900px 600px at 95% 105%, #0d1d2e 0%, transparent 55%),
        linear-gradient(160deg, #0b141d 0%, #070c12 100%);
      border: 1px solid rgba(120, 180, 210, 0.08);
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      /* Vejít se i na výšku: viewport minus HA hlavička a odsazení.
         SVG drží poměr stran (viewBox + meet), takže se jen zmenší a vycentruje. */
      max-height: calc(100vh - var(--header-height, 56px) - 24px);
      font-family: var(--paper-font-body1_-_font-family, 'Roboto', 'Segoe UI', sans-serif);
    }
    text {
      fill: rgba(226, 240, 248, 0.92);
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.4);
    }
    .node-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .big {
      font-size: 32px;
      font-weight: 700;
    }
    .medium {
      font-size: 17px;
      font-weight: 600;
    }
    .small {
      font-size: 14px;
      fill: rgba(226, 240, 248, 0.62);
    }
    .tiny {
      font-size: 11.5px;
      fill: rgba(226, 240, 248, 0.45);
    }
    .strong {
      font-weight: 700;
      fill: rgba(226, 240, 248, 0.92);
    }
    .dim {
      fill: rgba(226, 240, 248, 0.45);
    }
    .floor-name {
      font-size: 20px;
      font-weight: 700;
    }
    .floor-val {
      font-size: 15px;
    }
    .val-island {
      fill: #00e676;
    }
    .val-island.strong {
      fill: #00e676;
    }
    .val-grid {
      fill: #4fc3f7;
    }
    .val-grid.strong {
      fill: #4fc3f7;
    }
    .hit {
      cursor: pointer;
    }
    .hit:hover {
      fill: rgba(255, 255, 255, 0.04);
    }
    .phase-chip {
      cursor: pointer;
    }
    .phase-chip rect {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .phase-chip:hover rect {
      fill: rgba(255, 255, 255, 0.09);
      stroke: rgba(79, 195, 247, 0.55);
    }
    .chip-value {
      font-size: 13px;
      font-weight: 700;
      fill: #4fc3f7;
    }
    .chip-name {
      font-size: 10px;
      fill: rgba(226, 240, 248, 0.5);
    }
    .ctrl-chip {
      cursor: pointer;
    }
    .ctrl-chip rect {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .ctrl-chip:hover rect {
      fill: rgba(255, 255, 255, 0.1);
    }
    .ctrl-label {
      font-size: 12px;
      font-weight: 650;
      letter-spacing: 0.03em;
    }
    /* Rotace lopatek ventilátoru, když je chlazení zapnuté. */
    .spin {
      transform-box: fill-box;
      transform-origin: center;
      animation: fve-fan-spin 2.2s linear infinite;
    }
    @keyframes fve-fan-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,t([mt({attribute:!1})],ae.prototype,"hass",void 0),t([yt()],ae.prototype,"_config",void 0),ae=t([dt("fve-flow-card")],ae),window.customCards=window.customCards||[],window.customCards.push({type:"fve-flow-card",name:"FVE Flow Card",description:"Animovaný diagram toků energie pro ostrovní FVE (Victron) + grid po patrech (Shelly), se Solcast predikcí.",preview:!1,documentationURL:"https://github.com/elvisek/fve-flow-card"});export{ae as FveFlowCard};

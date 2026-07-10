function t(t,e,s,n){var o,r=arguments.length,a=r<3?e:null===n?n=Object.getOwnPropertyDescriptor(e,s):n;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,s,n);else for(var i=t.length-1;i>=0;i--)(o=t[i])&&(a=(r<3?o(a):r>3?o(e,s,a):o(e,s))||a);return r>3&&a&&Object.defineProperty(e,s,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,n=Symbol(),o=new WeakMap;let r=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&o.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[n+1],t[0]);return new r(s,t,n)},i=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,n))(e)})(t):t,{is:l,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,m=globalThis,y=m.trustedTypes,u=y?y.emptyScript:"",f=m.reactiveElementPolyfillSupport,$=(t,e)=>t,g={toAttribute(t,e){switch(e){case Boolean:t=t?u:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},x=(t,e)=>!l(t,e),v={attribute:!0,type:String,converter:g,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=v){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),n=this.getPropertyDescriptor(t,s,e);void 0!==n&&h(this.prototype,t,n)}}static getPropertyDescriptor(t,e,s){const{get:n,set:o}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:n,set(e){const r=n?.call(this);o?.call(this,e),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??v}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(i(t))}else void 0!==t&&e.push(i(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,n)=>{if(s)t.adoptedStyleSheets=n.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of n){const n=document.createElement("style"),o=e.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=s.cssText,t.appendChild(n)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,s);if(void 0!==n&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:g).toAttribute(e,s.type);this._$Em=t,null==o?this.removeAttribute(n):this.setAttribute(n,o),this._$Em=null}}_$AK(t,e){const s=this.constructor,n=s._$Eh.get(t);if(void 0!==n&&this._$Em!==n){const t=s.getPropertyOptions(n),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:g;this._$Em=n;const r=o.fromAttribute(e,t.type);this[n]=r??this._$Ej?.get(n)??r,this._$Em=null}}requestUpdate(t,e,s,n=!1,o){if(void 0!==t){const r=this.constructor;if(!1===n&&(o=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??x)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:n,wrapped:o},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===n&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,n=this[e];!0!==t||this._$AL.has(e)||void 0===n||this.C(e,void 0,s,n)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[$("elementProperties")]=new Map,b[$("finalized")]=new Map,f?.({ReactiveElement:b}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,E=w.trustedTypes,A=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+P,C=`<${M}>`,z=document,L=()=>z.createComment(""),j=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,T="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,O=/-->/g,F=/>/g,U=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),V=/'/g,R=/"/g,I=/^(?:script|style|textarea|title)$/i,D=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),W=D(1),B=D(2),Z=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),G=new WeakMap,K=z.createTreeWalker(z,129);function J(t,e){if(!H(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const Y=(t,e)=>{const s=t.length-1,n=[];let o,r=2===e?"<svg>":3===e?"<math>":"",a=N;for(let e=0;e<s;e++){const s=t[e];let i,l,h=-1,c=0;for(;c<s.length&&(a.lastIndex=c,l=a.exec(s),null!==l);)c=a.lastIndex,a===N?"!--"===l[1]?a=O:void 0!==l[1]?a=F:void 0!==l[2]?(I.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=U):void 0!==l[3]&&(a=U):a===U?">"===l[0]?(a=o??N,h=-1):void 0===l[1]?h=-2:(h=a.lastIndex-l[2].length,i=l[1],a=void 0===l[3]?U:'"'===l[3]?R:V):a===R||a===V?a=U:a===O||a===F?a=N:(a=U,o=void 0);const d=a===U&&t[e+1].startsWith("/>")?" ":"";r+=a===N?s+C:h>=0?(n.push(i),s.slice(0,h)+S+s.slice(h)+P+d):s+P+(-2===h?e:d)}return[J(t,r+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),n]};class Q{constructor({strings:t,_$litType$:e},s){let n;this.parts=[];let o=0,r=0;const a=t.length-1,i=this.parts,[l,h]=Y(t,e);if(this.el=Q.createElement(l,s),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(n=K.nextNode())&&i.length<a;){if(1===n.nodeType){if(n.hasAttributes())for(const t of n.getAttributeNames())if(t.endsWith(S)){const e=h[r++],s=n.getAttribute(t).split(P),a=/([.?@])?(.*)/.exec(e);i.push({type:1,index:o,name:a[2],strings:s,ctor:"."===a[1]?nt:"?"===a[1]?ot:"@"===a[1]?rt:st}),n.removeAttribute(t)}else t.startsWith(P)&&(i.push({type:6,index:o}),n.removeAttribute(t));if(I.test(n.tagName)){const t=n.textContent.split(P),e=t.length-1;if(e>0){n.textContent=E?E.emptyScript:"";for(let s=0;s<e;s++)n.append(t[s],L()),K.nextNode(),i.push({type:2,index:++o});n.append(t[e],L())}}}else if(8===n.nodeType)if(n.data===M)i.push({type:2,index:o});else{let t=-1;for(;-1!==(t=n.data.indexOf(P,t+1));)i.push({type:7,index:o}),t+=P.length-1}o++}}static createElement(t,e){const s=z.createElement("template");return s.innerHTML=t,s}}function X(t,e,s=t,n){if(e===Z)return e;let o=void 0!==n?s._$Co?.[n]:s._$Cl;const r=j(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,s,n)),void 0!==n?(s._$Co??=[])[n]=o:s._$Cl=o),void 0!==o&&(e=X(t,o._$AS(t,e.values),o,n)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,n=(t?.creationScope??z).importNode(e,!0);K.currentNode=n;let o=K.nextNode(),r=0,a=0,i=s[0];for(;void 0!==i;){if(r===i.index){let e;2===i.type?e=new et(o,o.nextSibling,this,t):1===i.type?e=new i.ctor(o,i.name,i.strings,this,t):6===i.type&&(e=new at(o,this,t)),this._$AV.push(e),i=s[++a]}r!==i?.index&&(o=K.nextNode(),r++)}return K.currentNode=z,n}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,n){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),j(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>H(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&j(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,n="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Q.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===n)this._$AH.p(e);else{const t=new tt(n,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new Q(t)),e}k(t){H(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,n=0;for(const o of t)n===e.length?e.push(s=new et(this.O(L()),this.O(L()),this,this.options)):s=e[n],s._$AI(o),n++;n<e.length&&(this._$AR(s&&s._$AB.nextSibling,n),e.length=n)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,n,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=n,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=q}_$AI(t,e=this,s,n){const o=this.strings;let r=!1;if(void 0===o)t=X(this,t,e,0),r=!j(t)||t!==this._$AH&&t!==Z,r&&(this._$AH=t);else{const n=t;let a,i;for(t=o[0],a=0;a<o.length-1;a++)i=X(this,n[s+a],e,a),i===Z&&(i=this._$AH[a]),r||=!j(i)||i!==this._$AH[a],i===q?t=q:t!==q&&(t+=(i??"")+o[a+1]),this._$AH[a]=i}r&&!n&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class nt extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class ot extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class rt extends st{constructor(t,e,s,n,o){super(t,e,s,n,o),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??q)===Z)return;const s=this._$AH,n=t===q&&s!==q||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==q&&(s===q||n);n&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const it=w.litHtmlPolyfillSupport;it?.(Q,et),(w.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;class ht extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const n=s?.renderBefore??e;let o=n._$litPart$;if(void 0===o){const t=s?.renderBefore??null;n._$litPart$=o=new et(e.insertBefore(L(),t),t,void 0,s??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}}ht._$litElement$=!0,ht.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ht});const ct=lt.litElementPolyfillSupport;ct?.({LitElement:ht}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:g,reflect:!1,hasChanged:x},_t=(t=pt,e,s)=>{const{kind:n,metadata:o}=s;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===n&&((t=Object.create(t)).wrapped=!0),r.set(s.name,t),"accessor"===n){const{name:n}=s;return{set(s){const o=e.get.call(this);e.set.call(this,s),this.requestUpdate(n,o,t,!0,s)},init(e){return void 0!==e&&this.C(n,void 0,t,e),e}}}if("setter"===n){const{name:n}=s;return function(s){const o=this[n];e.call(this,s),this.requestUpdate(n,o,t,!0,s)}}throw Error("Unsupported decorator location: "+n)};function mt(t){return(e,s)=>"object"==typeof s?_t(t,e,s):((t,e,s)=>{const n=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),n?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function yt(t){return mt({...t,state:!0,attribute:!1})}const ut={red:"#ff5252",yellow:"#ffd740",green:"#00e676"};function ft(t,e){if(!e||null==e.yellow_from&&null==e.green_from)return;const s=e.yellow_from??e.green_from,n=Math.max(e.green_from??e.yellow_from,s);let o=t<s?"red":t<n?"yellow":"green";return e.severity_invert&&(o="red"===o?"green":"green"===o?"red":"yellow"),ut[o]}function $t(t,e,s=0){if(!t||!e)return s;const n=t.states[e];if(!n)return s;const o=parseFloat(n.state);return Number.isFinite(o)?o:s}function gt(t,e){if(!t||!e)return!1;const s=t.states[e];return!!s&&Number.isFinite(parseFloat(s.state))}const xt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:1}),vt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}),bt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:0});function wt(t){const e=Math.abs(t);return e>=1e4?`${xt.format(t/1e3)} kW`:e>=1e3?`${vt.format(t/1e3)} kW`:`${bt.format(t)} W`}function kt(t){return Math.abs(t)>=1e3?`${vt.format(t/1e3)} MWh`:`${xt.format(t)} kWh`}function Et(t,e){if(!t||!e)return"—";const s=t.states[e];if(!s||"unknown"===s.state||"unavailable"===s.state)return"—";const n=s.attributes.unit_of_measurement??"",o=parseFloat(s.state);return Number.isFinite(o)&&String(o)===s.state.trim()?n?`${xt.format(o)} ${n}`:xt.format(o):t.formatEntityState?t.formatEntityState(s):n?`${s.state} ${n}`:s.state}function At(t,e,s){t.dispatchEvent(new CustomEvent(e,{detail:s,bubbles:!0,composed:!0,cancelable:!1}))}function St(t,e){e&&At(t,"hass-more-info",{entityId:e})}function Pt(t,e,s){if(s.hidden)return q;const n=s.animate&&Math.abs(s.power)>=s.deadband,o=`flow-${t}`,r=B`
    <path id="${o}" d="${e}" fill="none"
      stroke="${n?s.color:"rgba(148, 170, 190, 0.16)"}"
      stroke-width="${n?3:2}"
      stroke-linecap="round"
      opacity="${n?.85:1}"
      style="${n?`filter: drop-shadow(0 0 4px ${s.color})`:""}"/>`;if(!n)return r;const a=function(t,e,s,n){const o=Math.min(1,Math.max(0,t/Math.max(1,e))),r=Math.max(s,n-o*(n-s));return Math.round(4*r)/4}(Math.abs(s.power),s.maxPower,s.minDuration,s.maxDuration),i=s.reverse?"1;0":"0;1",l=Math.max(1,s.dots),h=[];for(let t=0;t<l;t++){const e=-(t*a/l).toFixed(2);h.push(B`
      <circle cx="0" cy="0" r="5" fill="${s.color}"
        style="filter: drop-shadow(0 0 6px ${s.color})">
        <animateMotion dur="${a}s" begin="${e}s" repeatCount="indefinite"
          keyPoints="${i}" keyTimes="0;1" calcMode="linear">
          <mpath href="#${o}"/>
        </animateMotion>
      </circle>`)}return B`${r}${h}`}function Mt(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${n}" fill="none"
       stroke-width="3" stroke-linecap="round"
       style="filter: drop-shadow(0 0 5px ${n})">
      <circle cx="32" cy="32" r="12"/>
      <line x1="32" y1="6"  x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6"  y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13" y1="13" x2="19" y2="19"/>
      <line x1="45" y1="45" x2="51" y2="51"/>
      <line x1="13" y1="51" x2="19" y2="45"/>
      <line x1="45" y1="19" x2="51" y2="13"/>
    </g>`}function Ct(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" fill="${n}"
       style="filter: drop-shadow(0 0 4px ${n})">
      <path d="M36 4 L14 36 L28 36 L24 60 L50 26 L34 26 Z"/>
    </g>`}function zt(t,e,s,n,o){const r=o?.rowFromBottom??0,a=t.y+t.h-72-10-80*r,i=(t.w-28-8*Math.max(0,e.length-1))/e.length;return B`${e.map((e,r)=>{const l=o?.itemStyle?.(e,r),h=l?.icon??o?.icon??Ct,c=l?.iconColor??o?.iconColor??"rgba(226,240,248,0.75)",d=l?.borderColor??o?.borderColor??"rgba(120,180,210,0.16)",p=t.x+14+r*(i+8),_=p+i/2,m=wt($t(s,e.entity)),y=_-7,u=a+8;return B`
      <g class="phase-chip" @click=${t=>{t.stopPropagation(),n(e.entity)}}>
        <title>${e.label} · ${e.name}</title>
        <rect x="${p}" y="${a}" width="${i}" height="${72}" rx="10"
          fill="rgba(255,255,255,0.045)" stroke="${d}" stroke-width="1"/>
        ${h(y,u,14,c)}
        <text x="${_}" y="${a+38}" text-anchor="middle" class="chip-value">${m}</text>
        <text x="${_}" y="${a+56}" text-anchor="middle" class="chip-name">${e.name}</text>
      </g>`})}`}const Lt="fve-flow-history-dialog";class jt extends HTMLElement{constructor(){super();const t=this.attachShadow({mode:"open"});t.innerHTML='\n      <style>\n        :host {\n          --dialog-accent: #4fc3f7;\n          color: var(--primary-text-color, #e6f4fa);\n          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);\n        }\n        dialog {\n          width: min(920px, calc(100vw - 32px));\n          max-width: 920px;\n          max-height: calc(100vh - 32px);\n          padding: 0;\n          overflow: hidden;\n          color: inherit;\n          background:\n            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 38%),\n            rgba(7, 16, 25, 0.98);\n          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);\n          border-radius: 20px;\n          box-shadow: 0 0 32px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 24px 80px rgba(0, 0, 0, 0.55);\n        }\n        dialog::backdrop {\n          background: rgba(0, 7, 13, 0.76);\n          backdrop-filter: blur(5px);\n        }\n        header {\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          min-height: 64px;\n          padding: 0 18px 0 22px;\n          border-bottom: 1px solid rgba(130, 190, 220, 0.12);\n        }\n        .accent {\n          width: 9px;\n          height: 9px;\n          flex: 0 0 auto;\n          border-radius: 50%;\n          background: var(--dialog-accent);\n          box-shadow: 0 0 10px var(--dialog-accent);\n        }\n        h2 {\n          min-width: 0;\n          flex: 1;\n          margin: 0;\n          overflow: hidden;\n          color: var(--primary-text-color, #e6f4fa);\n          font-size: 17px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n          text-overflow: ellipsis;\n          white-space: nowrap;\n        }\n        .range {\n          color: var(--secondary-text-color, rgba(220, 235, 245, 0.62));\n          font-size: 12px;\n          white-space: nowrap;\n        }\n        button {\n          display: grid;\n          width: 38px;\n          height: 38px;\n          padding: 0;\n          place-items: center;\n          color: var(--secondary-text-color, #a8bbc6);\n          font: inherit;\n          font-size: 25px;\n          line-height: 1;\n          cursor: pointer;\n          background: rgba(255, 255, 255, 0.05);\n          border: 1px solid rgba(255, 255, 255, 0.09);\n          border-radius: 50%;\n        }\n        button:hover,\n        button:focus-visible {\n          color: var(--primary-text-color, #fff);\n          outline: 1px solid var(--dialog-accent);\n        }\n        .chart {\n          min-height: 390px;\n          padding: 12px;\n          overflow: auto;\n        }\n        .chart > * {\n          display: block;\n          width: 100%;\n        }\n        @media (max-width: 600px) {\n          dialog {\n            width: calc(100vw - 16px);\n            max-height: calc(100vh - 16px);\n            border-radius: 16px;\n          }\n          header {\n            min-height: 58px;\n            padding: 0 10px 0 16px;\n          }\n          h2 {\n            font-size: 15px;\n          }\n          .range {\n            display: none;\n          }\n          .chart {\n            min-height: 320px;\n            padding: 8px;\n          }\n        }\n      </style>\n      <dialog aria-labelledby="history-title">\n        <header>\n          <span class="accent" aria-hidden="true"></span>\n          <h2 id="history-title"></h2>\n          <span class="range">posledních 48 hodin</span>\n          <button type="button" aria-label="Zavřít graf" title="Zavřít">×</button>\n        </header>\n        <div class="chart"></div>\n      </dialog>\n    ',this._dialog=t.querySelector("dialog"),this._chartHost=t.querySelector(".chart"),t.querySelector("button").addEventListener("click",()=>this._dialog.close()),this._dialog.addEventListener("click",t=>{t.target===this._dialog&&this._dialog.close()}),this._dialog.addEventListener("close",()=>this.remove())}show(t,e,s,n){this.shadowRoot.querySelector("h2").textContent=t,this.shadowRoot.querySelector(".range").textContent=e,this.style.setProperty("--dialog-accent",s),this._chartHost.replaceChildren(n),this._dialog.showModal()}}customElements.get(Lt)||customElements.define(Lt,jt);const Ht={entity:{domain:"sensor"}},Tt={text:{}},Nt={icon:{}},Ot={boolean:{}},Ft=(t,e,s=1)=>({number:{min:t,max:e,step:s,mode:"box"}}),Ut=[{name:"yellow_from",selector:Ft(0,2e4,50)},{name:"green_from",selector:Ft(0,2e4,50)},{name:"bar_max",selector:Ft(100,3e4,100)},{name:"severity_invert",selector:Ot}],Vt=[{name:"yellow_from",selector:Ft(0,100,1)},{name:"green_from",selector:Ft(0,100,1)}],Rt=[{name:"title",selector:Tt},{name:"pv",type:"expandable",icon:"mdi:solar-power",schema:[{name:"pv_panels",type:"expandable",flatten:!0,expanded:!0,title:"FVE panely",icon:"mdi:solar-power",schema:[{name:"power",required:!0,selector:Ht},{name:"energy_today",selector:Ht},{name:"energy_total",selector:Ht},{name:"max_power_today",selector:Ht},{name:"name",selector:Tt,custom_label:"Vlastní název FVE panelů"},...Ut]},{name:"pv_mppt",type:"expandable",flatten:!0,expanded:!0,title:"MPPT regulátor",icon:"mdi:current-dc",schema:[{name:"voltage",selector:Ht},{name:"current",selector:Ht},{name:"mppt_state",selector:Ht},{name:"mppt_name",selector:Tt,custom_label:"Vlastní název MPPT regulátoru"}]}]},{name:"battery",type:"expandable",icon:"mdi:battery-high",schema:[{name:"soc",required:!0,selector:Ht},{name:"power",selector:Ht},{name:"voltage",selector:Ht},{name:"current",selector:Ht},{name:"temperature",selector:Ht},{name:"soh",selector:Ht},{name:"runtime",selector:Ht},{name:"cycles",selector:Ht},{name:"time_to_full",selector:Ht},{name:"capacity",selector:Ht},{name:"invert",selector:Ot},{name:"name",selector:Tt,custom_label:"Vlastní název baterie"},...Vt]},{name:"inverter",type:"expandable",icon:"mdi:sine-wave",schema:[{name:"power",selector:Ht},{name:"state",selector:Ht},{name:"voltage",selector:Ht},{name:"current",selector:Ht},{name:"load_power",selector:Ht},{name:"days_in_service",selector:Ht},{name:"name",selector:Tt,custom_label:"Vlastní název měniče"},...Ut]},{name:"grid",type:"expandable",icon:"mdi:transmission-tower",schema:[{name:"power",selector:Ht},{name:"phase_a",selector:Ht},{name:"phase_b",selector:Ht},{name:"phase_c",selector:Ht},{name:"energy_total",selector:Ht},{name:"energy_today",selector:Ht},{name:"name",selector:Tt,custom_label:"Vlastní název sítě"},...Ut]},{name:"solcast",type:"expandable",icon:"mdi:weather-sunny",schema:[{name:"power_now",selector:Ht},{name:"remaining_today",selector:Ht},{name:"total_today",selector:Ht},{name:"total_tomorrow",selector:Ht},...Ut]},{name:"options",type:"expandable",icon:"mdi:tune",schema:[{name:"max_flow_w",selector:Ft(500,2e4,100)},{name:"deadband_w",selector:Ft(0,500,5)},{name:"dots",selector:Ft(1,8)},{name:"min_duration",selector:Ft(.5,10,.1)},{name:"max_duration",selector:Ft(1,20,.5)},{name:"animation",selector:Ot}]}],It=[{name:"name",required:!0,selector:Tt,custom_label:"Název patra"},{name:"floor_grid",type:"expandable",flatten:!0,expanded:!0,title:"Grid (síť) — Shelly *-GRID-AC-OUT",icon:"mdi:transmission-tower",schema:[{name:"grid_power",selector:Ht},{name:"grid_energy",selector:Ht},{name:"phase_a_entity",selector:Ht},{name:"phase_a_name",selector:Tt},{name:"phase_a_icon",selector:Nt},{name:"phase_b_entity",selector:Ht},{name:"phase_b_name",selector:Tt},{name:"phase_b_icon",selector:Nt},{name:"phase_c_entity",selector:Ht},{name:"phase_c_name",selector:Tt},{name:"phase_c_icon",selector:Nt}]},{name:"floor_fve",type:"expandable",flatten:!0,expanded:!0,title:"FVE (ostrov)",icon:"mdi:solar-power",schema:[{name:"island_power",selector:Ht},{name:"island_energy",selector:Ht}]}],Dt={title:"Titulek karty",pv:"FVE / MPPT",battery:"Baterie",inverter:"Měnič",grid:"Síť (grid)",solcast:"Předpověď Solcast",options:"Chování a animace",power:"Výkon (W)",energy_today:"Energie dnes (kWh)",energy_total:"Energie celkem (kWh)",max_power_today:"Maximální výkon dnes (W)",voltage:"Napětí (V)",current:"Proud (A)",mppt_state:"Režim / stav MPPT",soc:"Nabití SoC (%)",temperature:"Teplota",soh:"Zdraví SoH (%)",runtime:"Odhadovaná výdrž",cycles:"Počet nabíjecích cyklů",time_to_full:"Doba do plného nabití",capacity:"Instalovaná kapacita",invert:"Obrátit znaménko výkonu baterie",state:"Stav měniče",load_power:"Ostrovní spotřeba — kritické zátěže (W)",days_in_service:"Počet dní v provozu",name:"Vlastní název",phase_a:"Fáze L1",phase_b:"Fáze L2",phase_c:"Fáze L3",phase_a_entity:"Entita výkonu L1 (W)",phase_a_name:"Vlastní název L1 (např. Pračka)",phase_a_icon:"Ikona L1",phase_b_entity:"Entita výkonu L2 (W)",phase_b_name:"Vlastní název L2 (např. Sušička)",phase_b_icon:"Ikona L2",phase_c_entity:"Entita výkonu L3 (W)",phase_c_name:"Vlastní název L3 (např. Sporák)",phase_c_icon:"Ikona L3",power_now:"Predikovaný výkon teď (W)",remaining_today:"Zbývá dnes (kWh)",total_today:"Dnes celkem (kWh)",total_tomorrow:"Zítra celkem (kWh)",max_flow_w:"Výkon pro plnou rychlost animace (W)",deadband_w:"Mrtvá zóna — pod tímto výkonem je linka neaktivní (W)",dots:"Počet svítících teček na jedné aktivní lince",min_duration:"Nejrychlejší oběh tečky — při max. výkonu (s)",max_duration:"Nejpomalejší oběh tečky — těsně nad mrtvou zónou (s)",animation:"Animace pulzujících teček zapnuté",yellow_from:"Žlutá od hodnoty (pod ní červená)",green_from:"Zelená od hodnoty",bar_max:"Rozsah progress baru (max)",severity_invert:"Obrátit barvy (vysoká hodnota = špatná)",grid_power:"Výkon ze sítě (W) — nepovinné, jinak součet fází",grid_energy:"Energie ze sítě (kWh)",island_power:"Výkon z FVE (W)",island_energy:"Energie z FVE (kWh)"},Wt={max_flow_w:'Výkon, při kterém pulzy na lince běží nejrychleji (rychlost je od "mrtvé zóny" po tuto hodnotu plynulá). Nastav podle reálné špičky tvého systému, např. 5000 W pro měnič 5 kW.',deadband_w:'Pod touto hodnotou je tok energie tak malý, že se linka vykreslí jako klidná/šedá bez pulzů — potlačí to "věčné" mihotání kvůli šumu měření.',dots:'Kolik světelných teček se najednou pohybuje po jedné aktivní lince. Víc teček = hustší, "plnější" tok při vysokém výkonu.',min_duration:"Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon na hraně `max_flow_w` (nejrychlejší možný pohyb).",max_duration:'Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon jen kousek nad `deadband_w` (nejpomalejší, "sotva tekoucí" pohyb).',animation:"Vypnutím se pulzující tečky nekreslí vůbec — čísla, barvy a stavy uzlů se ale dál aktualizují normálně. Vhodné na slabší zařízení nebo pokud animace nechceš."};let Bt=class extends ht{constructor(){super(...arguments),this._computeLabel=t=>t.custom_label??Dt[t.name]??t.name,this._computeHelper=t=>Wt[t.name]}setConfig(t){this._config=t}render(){if(!this.hass||!this._config)return W``;const t=this._config.floors??[];return W`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${Rt}
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
                .schema=${It}
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
    `}_mainChanged(t){t.stopPropagation();const e=t.detail.value;this._emit({...e,floors:this._config?.floors??[]})}_floorChanged(t,e){t.stopPropagation();const s=[...this._config?.floors??[]];s[e]=t.detail.value,this._emit({...this._config,floors:s})}_addFloor(){const t=[...this._config?.floors??[],{name:`Patro ${(this._config?.floors?.length??0)+1}`}];this._emit({...this._config,floors:t})}_removeFloor(t){const e=(this._config?.floors??[]).filter((e,s)=>s!==t);this._emit({...this._config,floors:e})}_emit(t){this._config=t,At(this,"config-changed",{config:t})}};Bt.styles=a`
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
  `,t([mt({attribute:!1})],Bt.prototype,"hass",void 0),t([yt()],Bt.prototype,"_config",void 0),Bt=t([dt("fve-flow-card-editor")],Bt);const Zt="#00e676",qt="#00e676",Gt="#4fc3f7",Kt="#e040fb",Jt="#ffb74d",Yt="#69f0ae",Qt={L1:{color:"#f5f5f5",border:"rgba(245,245,245,0.28)"},L2:{color:"#78909c",border:"rgba(120,144,156,0.35)"},L3:{color:"#b87333",border:"rgba(184,115,51,0.38)"}};console.info("%c FVE-FLOW-CARD %c v0.2.5 ","color: #0a0f16; background: #00e676; font-weight: 700;","color: #00e676; background: #0a0f16; font-weight: 700;");let Xt=class extends ht{setConfig(t){if(!t)throw new Error("Chybí konfigurace");this._config=t}getCardSize(){return 12}getGridOptions(){return{columns:"full",rows:8,min_rows:4}}static async getConfigElement(){return document.createElement("fve-flow-card-editor")}static getStubConfig(){return{title:"Tok energie",pv:{power:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky",energy_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynos_dnes",energy_total:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_celkovy_vynos",max_power_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_maximalni_vykon_dnes",voltage:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_napeti_fv_sbernice",current:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_proud_dc_bateriove_sbernice",mppt_state:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_provozni_rezim_mppt"},battery:{soc:"sensor.pylontech_battery_id_512_nabijeni",power:"sensor.pylontech_battery_id_512_vykon",voltage:"sensor.pylontech_battery_id_512_napeti_dc_sbernice",current:"sensor.pylontech_battery_id_512_proud_dc_sbernice",temperature:"sensor.pylontech_battery_id_512_teplota",soh:"sensor.pylontech_battery_id_512_zdravi",runtime:"sensor.baterie_odhadovana_vydrz_2",time_to_full:"sensor.baterie_doba_do_plneho_nabiti",capacity:"sensor.pylontech_battery_id_512_instalovana_kapacita"},inverter:{power:"sensor.multiplus_ii_48_5000_70_50_id_275_vystupni_vykon_l1",state:"sensor.multiplus_ii_48_5000_70_50_id_275_stav",load_power:"sensor.gx_device_kriticke_zateze_na_l1",days_in_service:"sensor.fve_pocet_dni_v_provozu",name:"MultiPlus-II"},grid:{power:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_vykon",phase_a:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_a_vykon",phase_b:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_b_vykon",phase_c:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_c_vykon",energy_total:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_in_energie",name:"Síť ČEZ"},solcast:{power_now:"sensor.solcast_pv_forecast_power_now",remaining_today:"sensor.solcast_pv_forecast_forecast_remaining_today",total_today:"sensor.solcast_pv_forecast_forecast_today",total_tomorrow:"sensor.solcast_pv_forecast_forecast_tomorrow"},floors:[{name:"0NP",grid_energy:"sensor.0np_pradelna_dub_0np_grid_ac_out_energie",phase_a_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_c_vykon"},{name:"1NP",grid_energy:"sensor.dub_1np_grid_ac_out_energie",phase_a_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_c_vykon"}]}}_flowBase(){const t=this._config?.options??{};return{deadband:t.deadband_w??25,maxPower:t.max_flow_w??5e3,minDuration:t.min_duration??1.4,maxDuration:t.max_duration??6,dots:t.dots??3,animate:!1!==t.animation}}_entityName(t,e){const s=this.hass?.states[t]?.attributes.friendly_name;return e||("string"==typeof s?s:t)}_historySeries(t,e,s){return t?[{entity:t,name:e,color:s}]:[]}async _openHistory(t,e,s,n){if(!this.hass||!t.length)return;const o=await async function(t){if(!t.series.length)return!1;try{if(customElements.get("apexcharts-card")||await Promise.race([customElements.whenDefined("apexcharts-card"),new Promise(t=>window.setTimeout(t,1500))]),!customElements.get("apexcharts-card"))return console.warn("[FVE Flow Card] apexcharts-card není zaregistrovaná."),!1;const e={type:"custom:apexcharts-card",graph_span:"48h",...t.spanOffset?{span:{offset:t.spanOffset}}:{},update_interval:"1min",header:{show:!1},now:{show:!0,label:"Nyní"},apex_config:{chart:{height:360,background:"transparent",animations:{enabled:!0,easing:"easeinout",speed:500}},legend:{show:t.series.length>1,position:"top",horizontalAlign:"left"},grid:{borderColor:"rgba(148, 170, 190, 0.12)"},tooltip:{shared:!0,intersect:!1}},series:t.series.map(t=>({entity:t.entity,name:t.name,color:t.color,type:"area",curve:"smooth",stroke_width:2,stroke_dash:t.strokeDash??0,opacity:t.opacity??.22,extend_to:t.extendTo??"end",...t.dataGenerator?{data_generator:t.dataGenerator}:{fill_raw:t.fill??"last",group_by:{func:"avg",duration:"5min",fill:t.fill??"last"}},show:{extremas:!0,in_header:!1}}))},s=document.createElement("apexcharts-card");if("function"!=typeof s.setConfig)return!1;s.setConfig(e),s.hass=t.hass,s.style.setProperty("--ha-card-background","transparent"),s.style.setProperty("--card-background-color","transparent"),s.style.setProperty("--ha-card-box-shadow","none");const n=document.createElement(Lt);return document.body.append(n),n.show(t.title,t.rangeLabel||"posledních 48 hodin",t.series[0].color,s),!0}catch(t){return console.warn("[FVE Flow Card] Nepodařilo se otevřít 48h graf, používám nativní historii.",t),!1}}({hass:this.hass,title:e,series:t,spanOffset:s,rangeLabel:n});o||St(this,t[0].entity)}_openEntity(t,e,s){t&&this._openHistory(this._historySeries(t,this._entityName(t,e),s),e)}_openSolcastHistory(t){if(!t.power_now)return;const e=[t.total_today,t.total_tomorrow].filter(t=>!!t);if(!e.length)return void this._openEntity(t.power_now,"Předpověď Solcast","#ffd54f");const s=`\n      const entityIds = ${JSON.stringify(e)};\n      const now = Date.now();\n      const forecastEnd = now + 24 * 60 * 60 * 1000;\n      return entityIds\n        .flatMap((entityId) => {\n          const forecastEntity = hass.states[entityId];\n          return forecastEntity && Array.isArray(forecastEntity.attributes.detailedForecast)\n            ? forecastEntity.attributes.detailedForecast\n            : [];\n        })\n        .map((item) => {\n          const timestamp = new Date(item.period_start).getTime();\n          const watts = Number(item.pv_estimate) * 1000;\n          return [timestamp, watts];\n        })\n        .filter(([timestamp, watts]) =>\n          timestamp >= now - 30 * 60 * 1000 &&\n          timestamp <= forecastEnd &&\n          Number.isFinite(watts)\n        )\n        .map(([timestamp, watts]) => [Math.max(timestamp, now), watts]);\n    `;this._openHistory([{entity:t.power_now,name:"Skutečnost",color:"#4fc3f7",opacity:.18,extendTo:"now",fill:"null"},{entity:e[0],name:"Predikce",color:"#ffd54f",dataGenerator:s,strokeDash:5,opacity:.12,extendTo:!1}],"Solcast · skutečnost a predikce","+24h","24 h historie · 24 h predikce")}_openFloorHistory(t,e){const s=`${t.name||"Patro"} · výkon`,n=[];t.grid_power?n.push({entity:t.grid_power,name:"Síť",color:Gt}):e.forEach(t=>{n.push({entity:t.entity,name:t.name||t.label,color:Qt[t.label]?.color??Gt})}),t.island_power&&n.push({entity:t.island_power,name:"FVE",color:qt}),this._openHistory(n,s)}_gridPhases(t){return[[t.phase_a,"L1"],[t.phase_b,"L2"],[t.phase_c,"L3"]].filter(([t])=>!!t).map(([t,e])=>({entity:t,name:e,icon:"mdi:flash",label:e}))}_phases(t){const e=[],s=[[t.phase_a_entity,t.phase_a_name,t.phase_a_icon,"L1"],[t.phase_b_entity,t.phase_b_name,t.phase_b_icon,"L2"],[t.phase_c_entity,t.phase_c_name,t.phase_c_icon,"L3"]];for(const[t,n,o,r]of s)t&&e.push({entity:t,name:n||r,icon:o||"mdi:flash",label:r});return e}_floorGridPower(t){return t.grid_power&&gt(this.hass,t.grid_power)?$t(this.hass,t.grid_power):this._phases(t).reduce((t,e)=>t+$t(this.hass,e.entity),0)}render(){const t=this._config;if(!t)return W``;if(!this.hass)return W`<ha-card></ha-card>`;const e=t.floors??[],s=function(t){const e=Math.max(1,t),s={x:50,y:40,w:300,h:190},n={x:50,y:280,w:300,h:150},o={x:50,y:480,w:300,h:320},r={x:590,y:360,w:280,h:260},a={x:590,y:40,w:280,h:190},i={x:1020,y:40,w:310,h:210},l=[];for(let t=0;t<e;t++)l.push({x:1020,y:280+200*t,w:310,h:170});const h=l[l.length-1].y+170,c=s.x+s.w/2,d=r.y+r.h/2,p=i.y+i.h/2,_={pvMppt:`M ${c} ${s.y+s.h} L ${c} ${n.y}`,pvSolcast:`M ${s.x+s.w} ${s.y+s.h/2} H ${a.x}`,mpptInv:`M ${n.x+n.w} ${n.y+n.h/2} H 460 V ${r.y+50} H ${r.x}`,batInv:`M ${o.x+o.w} ${o.y+150} H 520 V ${r.y+120} H ${r.x}`,islandTaps:l.map(t=>{const e=t.y+t.h/2;return`M ${r.x+r.w} ${d} H 950 V ${e} H ${t.x}`}),gridTaps:l.map(t=>{const e=t.y+t.h/2;return`M ${i.x+i.w} ${p} H 1388 V ${e} H ${t.x+t.w}`})};return{width:1440,height:Math.max(820,h+40),pv:s,mppt:n,battery:o,inverter:r,solcast:a,grid:i,floors:l,paths:_}}(Math.max(1,e.length)),n=this._flowBase(),o=$t(this.hass,t.pv?.power),r=$t(this.hass,t.battery?.power),a=t.battery?.invert?-r:r,i=a>=n.deadband,l=a<=-n.deadband,h=gt(this.hass,t.inverter?.load_power)?$t(this.hass,t.inverter?.load_power):$t(this.hass,t.inverter?.power),c=gt(this.hass,t.grid?.power)?$t(this.hass,t.grid?.power):e.reduce((t,e)=>t+this._floorGridPower(e),0),d=(t,e,s)=>Pt(t,e,{...n,reverse:!1,hidden:!1,...s});return W`
      <ha-card>
        <svg
          viewBox="0 0 ${s.width} ${s.height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
        >
          ${t.title?B`<text class="card-title" x="${s.width/2}" y="26" text-anchor="middle">${t.title}</text>`:q}

          <!-- Toky (pod uzly) -->
          ${t.solcast?.power_now||t.solcast?.remaining_today||t.solcast?.total_today||t.solcast?.total_tomorrow?B`<path d="${s.paths.pvSolcast}" fill="none" stroke="#ffd54f"
                stroke-opacity="0.3" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round"/>`:q}
          ${d("pv-mppt",s.paths.pvMppt,{power:o,color:Zt,hidden:!t.pv?.power})}
          ${d("mppt-inv",s.paths.mpptInv,{power:o,color:Zt,hidden:!t.pv?.power})}
          ${d("bat-inv",s.paths.batInv,{power:a,color:i?Kt:Jt,reverse:i,hidden:!t.battery?.power})}
          ${s.paths.islandTaps.map((t,s)=>{const n=e[s],o=n?.island_power&&gt(this.hass,n.island_power)?$t(this.hass,n.island_power):h;return d(`island-${s}`,t,{power:o,color:qt})})}
          ${s.paths.gridTaps.map((t,s)=>{const n=e[s];return d(`grid-${s}`,t,{power:n?this._floorGridPower(n):0,color:Gt})})}

          <!-- Uzly -->
          ${this._nodePv(s.pv)}
          ${this._nodeMppt(s.mppt)}
          ${this._nodeBattery(s.battery,a,i,l)}
          ${this._nodeInverter(s.inverter,h)}
          ${this._nodeSolcast(s.solcast)}
          ${this._nodeGrid(s.grid,c)}
          ${s.floors.map((t,s)=>e[s]?this._nodeFloor(t,e[s]):q)}
        </svg>
      </ha-card>
    `}_panel(t,e,s=!0){return B`
      <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="rgba(14, 24, 34, 0.72)"
        stroke="${e}" stroke-opacity="${s?.5:.18}" stroke-width="1.5"
        style="${s?`filter: drop-shadow(0 0 10px ${e}40)`:""}"/>`}_bar(t,e,s,n){const o=t.w-40,r=Math.max(0,Math.min(1,Math.abs(e)/Math.max(1,s)));return B`
      <rect x="${t.x+20}" y="${t.y+t.h-12}" width="${o}" height="4" rx="2"
        fill="rgba(255,255,255,0.08)"/>
      ${r>0?B`<rect x="${t.x+20}" y="${t.y+t.h-12}" width="${Math.max(4,o*r)}" height="4" rx="2"
            fill="${n}" style="filter: drop-shadow(0 0 4px ${n})"/>`:q}`}_hit(t,e){return e?B`
      <rect class="hit" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="transparent" @click=${e}>
        <title>Zobrazit graf za 48 hodin</title>
      </rect>`:q}_nodePv(t){const e=this._config?.pv??{},s=$t(this.hass,e.power),n=Math.abs(s)>=this._flowBase().deadband,o=ft(s,e),r=o??Zt;return B`
      ${this._panel(t,r,n)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${e.name||"FVE panely"}</text>
      ${function(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${n}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${n})">
      <path d="M14 8 L58 8 L50 44 L6 44 Z"/>
      <line x1="28" y1="8" x2="21" y2="44"/>
      <line x1="43" y1="8" x2="36" y2="44"/>
      <line x1="11" y1="26" x2="54" y2="26"/>
      <line x1="28" y1="44" x2="28" y2="56"/>
      <line x1="18" y1="56" x2="38" y2="56"/>
    </g>`}(t.x+18,t.y+46,60,n?r:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${r}">${e.power?wt(s):"—"}</text>
      ${o?this._bar(t,s,e.bar_max??this._flowBase().maxPower,o):q}
      <text class="small" x="${t.x+90}" y="${t.y+112}">
        Dnes <tspan class="strong">${e.energy_today?kt($t(this.hass,e.energy_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+134}">
        Špička dnes <tspan class="strong">${e.max_power_today?wt($t(this.hass,e.max_power_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+156}">
        Celkem <tspan class="strong">${e.energy_total?kt($t(this.hass,e.energy_total)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power?()=>this._openEntity(e.power,e.name||"FVE panely",r):void 0)}
    `}_nodeMppt(t){const e=this._config?.pv??{},s=Et(this.hass,e.mppt_state),n=e.mppt_state?this.hass?.states[e.mppt_state]?.state.trim().toLowerCase():void 0,o=!!n&&!["off","vypnuto","unknown","unavailable"].includes(n);return B`
      ${this._panel(t,Zt,o)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${e.mppt_name||"MPPT regulátor"}</text>
      ${function(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${n}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${n})">
      <rect x="8" y="12" width="48" height="40" rx="6"/>
      <path d="M16 40 L26 40 L32 24 L38 40 L48 40"/>
      <line x1="24" y1="52" x2="24" y2="58"/>
      <line x1="40" y1="52" x2="40" y2="58"/>
    </g>`}(t.x+18,t.y+44,48,o?Zt:"rgba(148,170,190,0.5)")}
      <text class="medium" x="${t.x+80}" y="${t.y+66}">${s}</text>
      <text class="small" x="${t.x+80}" y="${t.y+92}">
        Napětí <tspan class="strong">${e.voltage?Et(this.hass,e.voltage):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+80}" y="${t.y+114}">
        Proud <tspan class="strong">${e.current?Et(this.hass,e.current):"—"}</tspan>
      </text>
      ${this._hit(t,e.mppt_state||e.voltage?()=>St(this,e.mppt_state??e.voltage):void 0)}
    `}_nodeBattery(t,e,s,n){const o=this._config?.battery??{},r=$t(this.hass,o.soc,0),a=ft(r,{yellow_from:o.yellow_from??15,green_from:o.green_from??40,severity_invert:o.severity_invert}),i=s?`▲ nabíjení ${wt(Math.abs(e))}`:n?`▼ vybíjení ${wt(Math.abs(e))}`:"● klidový stav",l=s?Kt:n?Jt:"rgba(220,235,245,0.55)";return B`
      ${this._panel(t,a,!0)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${o.name||"Baterie Pylontech"}</text>
      ${function(t,e,s,n,o,r){const a=.4*s,i=n-12,l=Math.max(0,Math.min(1,o/100))*i;return B`
    <g style="filter: drop-shadow(0 0 6px ${r})">
      <rect x="${t+(s-a)/2}" y="${e-10}" width="${a}" height="${14}" rx="3"
        fill="none" stroke="${r}" stroke-width="3"/>
      <rect x="${t}" y="${e}" width="${s}" height="${n}" rx="10"
        fill="rgba(0,0,0,0.35)" stroke="${r}" stroke-width="3"/>
      <rect x="${t+6}" y="${e+6+(i-l)}" width="${s-12}" height="${l}" rx="5"
        fill="${r}" opacity="0.85"/>
    </g>`}(t.x+30,t.y+62,58,168,r,a)}
      <text class="tiny" x="${t.x+59}" y="${t.y+252}" text-anchor="middle">
        ${o.capacity?Et(this.hass,o.capacity):""}
      </text>
      <text class="big" x="${t.x+118}" y="${t.y+90}" style="fill: ${a}">${o.soc?`${Math.round(r)} %`:"—"}</text>
      <text class="medium" x="${t.x+118}" y="${t.y+122}" style="fill: ${l}">${o.power?i:""}</text>
      <text class="small" x="${t.x+118}" y="${t.y+152}">
        Napětí <tspan class="strong">${o.voltage?Et(this.hass,o.voltage):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+174}">
        Proud <tspan class="strong">${o.current?Et(this.hass,o.current):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+196}">
        Teplota <tspan class="strong">${o.temperature?Et(this.hass,o.temperature):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+218}">
        ${o.soh?`SoH ${Et(this.hass,o.soh)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+242}">
        ${o.runtime?`Výdrž ${Et(this.hass,o.runtime)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+262}">
        ${o.cycles?`Počet cyklů ${Et(this.hass,o.cycles)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+282}">
        ${s&&o.time_to_full?`Do nabití ${Et(this.hass,o.time_to_full)}`:""}
      </text>
      ${this._hit(t,o.soc?()=>this._openEntity(o.soc,`${o.name||"Baterie Pylontech"} · SoC`,a):void 0)}
    `}_nodeInverter(t,e){const s=this._config?.inverter??{},n=gt(this.hass,s.power)?$t(this.hass,s.power):e,o=Et(this.hass,s.state),r=Math.abs(n)>=this._flowBase().deadband||"—"!==o,a=ft(n,s),i=a??qt;return B`
      ${this._panel(t,i,r)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${s.name||"Měnič MultiPlus-II"}</text>
      ${function(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${n}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${n})">
      <rect x="6" y="6" width="52" height="52" rx="10"/>
      <path d="M20 26 A 14 14 0 0 1 44 26" />
      <path d="M44 26 l 1 -8 m -1 8 l -8 -1"/>
      <path d="M44 38 A 14 14 0 0 1 20 38" />
      <path d="M20 38 l -1 8 m 1 -8 l 8 1"/>
    </g>`}(t.x+18,t.y+46,56,r?i:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${i}">${wt(n)}</text>
      <circle cx="${t.x+96}" cy="${t.y+106}" r="4" fill="${"—"!==o?Yt:"rgba(148,170,190,0.4)"}"/>
      <text class="small" x="${t.x+108}" y="${t.y+111}">${o}</text>
      ${s.voltage?B`<text class="small" x="${t.x+90}" y="${t.y+138}">
            Napětí <tspan class="strong">${Et(this.hass,s.voltage)}</tspan>
          </text>`:q}
      ${s.current?B`<text class="small" x="${t.x+90}" y="${t.y+160}">
            Proud <tspan class="strong">${Et(this.hass,s.current)}</tspan>
          </text>`:q}
      ${s.load_power?B`<text class="tiny" x="${t.x+90}" y="${t.y+184}">
            Kritické zátěže ${wt($t(this.hass,s.load_power))}
          </text>`:q}
      ${a?this._bar(t,n,s.bar_max??this._flowBase().maxPower,a):q}
      ${s.days_in_service?B`<text class="tiny" x="${t.x+20}" y="${t.y+t.h-20}">
            Počet dní v provozu <tspan class="strong">${Et(this.hass,s.days_in_service)}</tspan>
          </text>`:q}
      ${this._hit(t,s.power||s.load_power?()=>this._openEntity(s.power??s.load_power,s.name||"Měnič MultiPlus-II",i):void 0)}
    `}_nodeSolcast(t){const e=this._config?.solcast;if(!e||!e.power_now&&!e.remaining_today&&!e.total_today&&!e.total_tomorrow)return q;const s=$t(this.hass,e.power_now),n=ft(s,e),o=n??"#ffd54f",r=Math.abs(s)>=this._flowBase().deadband;return B`
      ${this._panel(t,o,r)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">Předpověď Solcast</text>
      ${Mt(t.x+16,t.y+58,56,r?o:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${o}">
        ${e.power_now?wt(s):"—"}
      </text>
      ${n?this._bar(t,s,e.bar_max??this._flowBase().maxPower,n):q}
      <text class="small" x="${t.x+90}" y="${t.y+112}">
        Zbývá dnes <tspan class="strong">${e.remaining_today?kt($t(this.hass,e.remaining_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+134}">
        Dnes celkem <tspan class="strong">${e.total_today?kt($t(this.hass,e.total_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+156}">
        Zítra celkem <tspan class="strong">${e.total_tomorrow?kt($t(this.hass,e.total_tomorrow)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power_now?()=>this._openSolcastHistory(e):void 0)}
    `}_nodeGrid(t,e){const s=this._config?.grid??{},n=Math.abs(e)>=this._flowBase().deadband,o=this._gridPhases(s),r=ft(e,s),a=r??Gt;return B`
      ${this._panel(t,a,n)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${s.name||"Síť ČEZ"}</text>
      ${function(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${n}" fill="none"
       stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${n})">
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
    </g>`}(t.x+16,t.y+44,52,n?a:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${a}">${wt(e)}</text>
      ${r?this._bar(t,e,s.bar_max??this._flowBase().maxPower,r):q}
      <text class="tiny" x="${t.x+90}" y="${t.y+108}">
        ${s.energy_total?`Celkem ze sítě ${kt($t(this.hass,s.energy_total))}`:""}
        ${s.energy_today?` · dnes ${kt($t(this.hass,s.energy_today))}`:""}
      </text>
      ${this._hit(t,s.power?()=>this._openEntity(s.power,s.name||"Síť",a):void 0)}
      ${o.length?zt(t,o,this.hass,t=>{const e=o.find(e=>e.entity===t);this._openEntity(t,this._entityName(t),e?Qt[e.label]?.color??Gt:Gt)},{itemStyle:t=>({iconColor:Qt[t.label]?.color??Gt,borderColor:Qt[t.label]?.border})}):q}
    `}_nodeFloor(t,e){const s=this._floorGridPower(e),n=!!e.island_power&&gt(this.hass,e.island_power),o=n?$t(this.hass,e.island_power):0,r=this._phases(e),a=Math.abs(s)>=this._flowBase().deadband||n&&Math.abs(o)>=this._flowBase().deadband,i=n&&o>s?qt:Gt,l=n?{entity:e.island_power,name:"FVE výroba",icon:"mdi:solar-power",label:"FVE"}:null,h=l?[l,...r]:r;return B`
      ${this._panel(t,i,a)}
      ${function(t,e,s,n){return B`
    <g transform="translate(${t},${e}) scale(${s/64})" stroke="${n}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${n})">
      <path d="M8 32 L32 10 L56 32"/>
      <path d="M14 28 L14 56 L50 56 L50 28"/>
      <path d="M26 56 L26 40 L38 40 L38 56"/>
    </g>`}(t.x+16,t.y+12,30,i)}
      <text class="floor-name" x="${t.x+54}" y="${t.y+34}">${e.name??"Patro"}</text>
      <text class="floor-val" x="${t.x+t.w-20}" y="${t.y+32}" text-anchor="end">
        <tspan class="dim">síť </tspan><tspan class="val-grid strong">${wt(s)}</tspan>
      </text>
      <text class="tiny" x="${t.x+54}" y="${t.y+56}">
        ${e.grid_energy?`Celkem ze sítě ${kt($t(this.hass,e.grid_energy))}`:""}
        ${e.island_energy?` · z fve ${kt($t(this.hass,e.island_energy))}`:""}
      </text>
      ${this._hit({x:t.x,y:t.y,w:t.w,h:64},e.grid_power||e.island_power||r.length?()=>this._openFloorHistory(e,r):void 0)}
      ${h.length?zt(t,h,this.hass,t=>{const s=h.find(e=>e.entity===t);this._openEntity(t,s?`${e.name||"Patro"} · ${s.name}`:this._entityName(t),s===l?qt:s?Qt[s.label]?.color??Gt:Gt)},{itemStyle:t=>t===l?{icon:Mt,iconColor:qt,borderColor:"rgba(0,230,118,0.22)"}:{iconColor:Qt[t.label]?.color??Gt,borderColor:Qt[t.label]?.border}}):q}
    `}};Xt.styles=a`
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
  `,t([mt({attribute:!1})],Xt.prototype,"hass",void 0),t([yt()],Xt.prototype,"_config",void 0),Xt=t([dt("fve-flow-card")],Xt),window.customCards=window.customCards||[],window.customCards.push({type:"fve-flow-card",name:"FVE Flow Card",description:"Animovaný diagram toků energie pro ostrovní FVE (Victron) + grid po patrech (Shelly), se Solcast predikcí.",preview:!1,documentationURL:"https://github.com/elvisek/fve-flow-card"});export{Xt as FveFlowCard};

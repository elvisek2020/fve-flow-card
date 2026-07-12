function t(t,e,n,o){var s,a=arguments.length,r=a<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,n,o);else for(var i=t.length-1;i>=0;i--)(s=t[i])&&(r=(a<3?s(r):a>3?s(e,n,r):s(e,n))||r);return a>3&&r&&Object.defineProperty(e,n,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,n=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let a=class{constructor(t,e,n){if(this._$cssResult$=!0,n!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(n&&void 0===t){const n=void 0!==e&&1===e.length;n&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),n&&s.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const n=1===t.length?t[0]:e.reduce((e,n,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+t[o+1],t[0]);return new a(n,t,o)},i=n?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const n of t.cssRules)e+=n.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,m=globalThis,u=m.trustedTypes,y=u?u.emptyScript:"",f=m.reactiveElementPolyfillSupport,g=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?y:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=null!==t;break;case Number:n=null===t?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch(t){n=null}}return n}},$=(t,e)=>!l(t,e),v={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=v){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const n=Symbol(),o=this.getPropertyDescriptor(t,n,e);void 0!==o&&c(this.prototype,t,o)}}static getPropertyDescriptor(t,e,n){const{get:o,set:s}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const a=o?.call(this);s?.call(this,e),this.requestUpdate(t,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??v}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const t=_(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const n of e)this.createProperty(n,t[n])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,n]of e)this.elementProperties.set(t,n)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const n=this._$Eu(t,e);void 0!==n&&this._$Eh.set(n,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const n=new Set(t.flat(1/0).reverse());for(const t of n)e.unshift(i(t))}else void 0!==t&&e.push(i(t));return e}static _$Eu(t,e){const n=e.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const n of e.keys())this.hasOwnProperty(n)&&(t.set(n,this[n]),delete this[n]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,o)=>{if(n)t.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const n of o){const o=document.createElement("style"),s=e.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=n.cssText,t.appendChild(o)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,n){this._$AK(t,n)}_$ET(t,e){const n=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,n);if(void 0!==o&&!0===n.reflect){const s=(void 0!==n.converter?.toAttribute?n.converter:x).toAttribute(e,n.type);this._$Em=t,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(t,e){const n=this.constructor,o=n._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=n.getPropertyOptions(o),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=o;const a=s.fromAttribute(e,t.type);this[o]=a??this._$Ej?.get(o)??a,this._$Em=null}}requestUpdate(t,e,n,o=!1,s){if(void 0!==t){const a=this.constructor;if(!1===o&&(s=this[t]),n??=a.getPropertyOptions(t),!((n.hasChanged??$)(s,e)||n.useDefault&&n.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(a._$Eu(t,n))))return;this.C(t,e,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:n,reflect:o,wrapped:s},a){n&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,a??e??this[t]),!0!==s||void 0!==a)||(this._$AL.has(t)||(this.hasUpdated||n||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,n]of t){const{wrapped:t}=n,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,n,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[g("elementProperties")]=new Map,b[g("finalized")]=new Map,f?.({ReactiveElement:b}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,E=w.trustedTypes,C=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,A="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,S="?"+M,z=`<${S}>`,P=document,L=()=>P.createComment(""),F=t=>null===t||"object"!=typeof t&&"function"!=typeof t,j=Array.isArray,H="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,O=/-->/g,V=/>/g,N=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,U=/"/g,D=/^(?:script|style|textarea|title)$/i,I=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),W=I(1),B=I(2),Z=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),G=new WeakMap,K=P.createTreeWalker(P,129);function J(t,e){if(!j(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const Y=(t,e)=>{const n=t.length-1,o=[];let s,a=2===e?"<svg>":3===e?"<math>":"",r=T;for(let e=0;e<n;e++){const n=t[e];let i,l,c=-1,h=0;for(;h<n.length&&(r.lastIndex=h,l=r.exec(n),null!==l);)h=r.lastIndex,r===T?"!--"===l[1]?r=O:void 0!==l[1]?r=V:void 0!==l[2]?(D.test(l[2])&&(s=RegExp("</"+l[2],"g")),r=N):void 0!==l[3]&&(r=N):r===N?">"===l[0]?(r=s??T,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,i=l[1],r=void 0===l[3]?N:'"'===l[3]?U:R):r===U||r===R?r=N:r===O||r===V?r=T:(r=N,s=void 0);const d=r===N&&t[e+1].startsWith("/>")?" ":"";a+=r===T?n+z:c>=0?(o.push(i),n.slice(0,c)+A+n.slice(c)+M+d):n+M+(-2===c?e:d)}return[J(t,a+(t[n]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class Q{constructor({strings:t,_$litType$:e},n){let o;this.parts=[];let s=0,a=0;const r=t.length-1,i=this.parts,[l,c]=Y(t,e);if(this.el=Q.createElement(l,n),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=K.nextNode())&&i.length<r;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(A)){const e=c[a++],n=o.getAttribute(t).split(M),r=/([.?@])?(.*)/.exec(e);i.push({type:1,index:s,name:r[2],strings:n,ctor:"."===r[1]?ot:"?"===r[1]?st:"@"===r[1]?at:nt}),o.removeAttribute(t)}else t.startsWith(M)&&(i.push({type:6,index:s}),o.removeAttribute(t));if(D.test(o.tagName)){const t=o.textContent.split(M),e=t.length-1;if(e>0){o.textContent=E?E.emptyScript:"";for(let n=0;n<e;n++)o.append(t[n],L()),K.nextNode(),i.push({type:2,index:++s});o.append(t[e],L())}}}else if(8===o.nodeType)if(o.data===S)i.push({type:2,index:s});else{let t=-1;for(;-1!==(t=o.data.indexOf(M,t+1));)i.push({type:7,index:s}),t+=M.length-1}s++}}static createElement(t,e){const n=P.createElement("template");return n.innerHTML=t,n}}function X(t,e,n=t,o){if(e===Z)return e;let s=void 0!==o?n._$Co?.[o]:n._$Cl;const a=F(e)?void 0:e._$litDirective$;return s?.constructor!==a&&(s?._$AO?.(!1),void 0===a?s=void 0:(s=new a(t),s._$AT(t,n,o)),void 0!==o?(n._$Co??=[])[o]=s:n._$Cl=s),void 0!==s&&(e=X(t,s._$AS(t,e.values),s,o)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:n}=this._$AD,o=(t?.creationScope??P).importNode(e,!0);K.currentNode=o;let s=K.nextNode(),a=0,r=0,i=n[0];for(;void 0!==i;){if(a===i.index){let e;2===i.type?e=new et(s,s.nextSibling,this,t):1===i.type?e=new i.ctor(s,i.name,i.strings,this,t):6===i.type&&(e=new rt(s,this,t)),this._$AV.push(e),i=n[++r]}a!==i?.index&&(s=K.nextNode(),a++)}return K.currentNode=P,o}p(t){let e=0;for(const n of this._$AV)void 0!==n&&(void 0!==n.strings?(n._$AI(t,n,e),e+=n.strings.length-2):n._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,n,o){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=n,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),F(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==Z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>j(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&F(this._$AH)?this._$AA.nextSibling.data=t:this.T(P.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:n}=t,o="number"==typeof n?this._$AC(t):(void 0===n.el&&(n.el=Q.createElement(J(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new tt(o,this),n=t.u(this.options);t.p(e),this.T(n),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new Q(t)),e}k(t){j(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let n,o=0;for(const s of t)o===e.length?e.push(n=new et(this.O(L()),this.O(L()),this,this.options)):n=e[o],n._$AI(s),o++;o<e.length&&(this._$AR(n&&n._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class nt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,n,o,s){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=s,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=q}_$AI(t,e=this,n,o){const s=this.strings;let a=!1;if(void 0===s)t=X(this,t,e,0),a=!F(t)||t!==this._$AH&&t!==Z,a&&(this._$AH=t);else{const o=t;let r,i;for(t=s[0],r=0;r<s.length-1;r++)i=X(this,o[n+r],e,r),i===Z&&(i=this._$AH[r]),a||=!F(i)||i!==this._$AH[r],i===q?t=q:t!==q&&(t+=(i??"")+s[r+1]),this._$AH[r]=i}a&&!o&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class ot extends nt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class st extends nt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class at extends nt{constructor(t,e,n,o,s){super(t,e,n,o,s),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??q)===Z)return;const n=this._$AH,o=t===q&&n!==q||t.capture!==n.capture||t.once!==n.once||t.passive!==n.passive,s=t!==q&&(n===q||o);o&&this.element.removeEventListener(this.name,this,n),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,n){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const it=w.litHtmlPolyfillSupport;it?.(Q,et),(w.litHtmlVersions??=[]).push("3.3.3");const lt=globalThis;class ct extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,n)=>{const o=n?.renderBefore??e;let s=o._$litPart$;if(void 0===s){const t=n?.renderBefore??null;o._$litPart$=s=new et(e.insertBefore(L(),t),t,void 0,n??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}}ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const ht=lt.litElementPolyfillSupport;ht?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,n)=>{void 0!==n?n.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:$},_t=(t=pt,e,n)=>{const{kind:o,metadata:s}=n;let a=globalThis.litPropertyMetadata.get(s);if(void 0===a&&globalThis.litPropertyMetadata.set(s,a=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),a.set(n.name,t),"accessor"===o){const{name:o}=n;return{set(n){const s=e.get.call(this);e.set.call(this,n),this.requestUpdate(o,s,t,!0,n)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=n;return function(n){const s=this[o];e.call(this,n),this.requestUpdate(o,s,t,!0,n)}}throw Error("Unsupported decorator location: "+o)};function mt(t){return(e,n)=>"object"==typeof n?_t(t,e,n):((t,e,n)=>{const o=e.hasOwnProperty(n);return e.constructor.createProperty(n,t),o?Object.getOwnPropertyDescriptor(e,n):void 0})(t,e,n)}function ut(t){return mt({...t,state:!0,attribute:!1})}const yt=968;const ft=26;const gt={red:"#ff5252",yellow:"#ffd740",green:"#00e676"};function xt(t,e){if(!e||null==e.yellow_from&&null==e.green_from)return;const n=e.yellow_from??e.green_from,o=Math.max(e.green_from??e.yellow_from,n);let s=t<n?"red":t<o?"yellow":"green";return e.severity_invert&&(s="red"===s?"green":"green"===s?"red":"yellow"),gt[s]}function $t(t,e,n=0){if(!t||!e)return n;const o=t.states[e];if(!o)return n;const s=parseFloat(o.state);return Number.isFinite(s)?s:n}function vt(t,e){if(!t||!e)return!1;const n=t.states[e];return!!n&&Number.isFinite(parseFloat(n.state))}const bt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:1}),wt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}),kt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:0});function Et(t){const e=Math.abs(t);return e>=1e4?`${bt.format(t/1e3)} kW`:e>=1e3?`${wt.format(t/1e3)} kW`:`${kt.format(t)} W`}function Ct(t){return Math.abs(t)>=1e3?`${wt.format(t/1e3)} MWh`:`${bt.format(t)} kWh`}function At(t,e){if(!t||!e)return"—";const n=t.states[e];if(!n||"unknown"===n.state||"unavailable"===n.state)return"—";const o=n.attributes.unit_of_measurement??"",s=parseFloat(n.state);return Number.isFinite(s)&&String(s)===n.state.trim()?o?`${bt.format(s)} ${o}`:bt.format(s):t.formatEntityState?t.formatEntityState(n):o?`${n.state} ${o}`:n.state}function Mt(t,e,n){t.dispatchEvent(new CustomEvent(e,{detail:n,bubbles:!0,composed:!0,cancelable:!1}))}function St(t,e){e&&Mt(t,"hass-more-info",{entityId:e})}function zt(t,e,n){if(n.hidden)return q;const o=n.animate&&Math.abs(n.power)>=n.deadband,s=`flow-${t}`,a=B`
    <path id="${s}" d="${e}" fill="none"
      stroke="${o?n.color:"rgba(148, 170, 190, 0.16)"}"
      stroke-width="${o?3:2}"
      stroke-linecap="round"
      opacity="${o?.85:1}"
      style="${o?`filter: drop-shadow(0 0 4px ${n.color})`:""}"/>`;if(!o)return a;const r=function(t,e,n,o){const s=Math.min(1,Math.max(0,t/Math.max(1,e))),a=Math.max(n,o-s*(o-n));return Math.round(4*a)/4}(Math.abs(n.power),n.maxPower,n.minDuration,n.maxDuration),i=n.reverse?"1;0":"0;1",l=Math.max(1,n.dots),c=[];for(let t=0;t<l;t++){const e=-(t*r/l).toFixed(2);c.push(B`
      <circle cx="0" cy="0" r="5" fill="${n.color}"
        style="filter: drop-shadow(0 0 6px ${n.color})">
        <animateMotion dur="${r}s" begin="${e}s" repeatCount="indefinite"
          keyPoints="${i}" keyTimes="0;1" calcMode="linear">
          <mpath href="#${s}"/>
        </animateMotion>
      </circle>`)}return B`${a}${c}`}function Pt(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <circle cx="32" cy="32" r="12"/>
      <line x1="32" y1="6"  x2="32" y2="14"/>
      <line x1="32" y1="50" x2="32" y2="58"/>
      <line x1="6"  y1="32" x2="14" y2="32"/>
      <line x1="50" y1="32" x2="58" y2="32"/>
      <line x1="13" y1="13" x2="19" y2="19"/>
      <line x1="45" y1="45" x2="51" y2="51"/>
      <line x1="13" y1="51" x2="19" y2="45"/>
      <line x1="45" y1="19" x2="51" y2="13"/>
    </g>`}function Lt(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" fill="${o}"
       style="filter: drop-shadow(0 0 4px ${o})">
      <path d="M36 4 L14 36 L28 36 L24 60 L50 26 L34 26 Z"/>
    </g>`}function Ft(t,e,n,o,s=!1){return B`
    <g transform="translate(${t},${e}) scale(${n/24})" fill="${o}"
       style="filter: drop-shadow(0 0 4px ${o})">
      <path class="${s?"spin":""}" d="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z"/>
    </g>`}function jt(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/24})" fill="${o}"
       style="filter: drop-shadow(0 0 4px ${o})">
      <path d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"/>
    </g>`}function Ht(t,e,n,o,s){const a=s?.rowFromBottom??0,r=t.y+t.h-72-24-80*a,i=s?.zone?s.zone.x:t.x+14,l=((s?.zone?s.zone.w:t.w-28)-8*Math.max(0,e.length-1))/e.length;return B`${e.map((t,e)=>{const a=s?.itemStyle?.(t,e),c=a?.icon??s?.icon??Lt,h=a?.iconColor??s?.iconColor??"rgba(226,240,248,0.75)",d=a?.borderColor??s?.borderColor??"rgba(120,180,210,0.16)",p=i+e*(l+8),_=p+l/2,m=Et($t(n,t.entity)),u=_-7,y=r+12;return B`
      <g class="phase-chip" @click=${e=>{e.stopPropagation(),o(t.entity)}}>
        <title>${t.label} · ${t.name}</title>
        <rect x="${p}" y="${r}" width="${l}" height="${72}" rx="10"
          fill="rgba(255,255,255,0.045)" stroke="${d}" stroke-width="1"/>
        ${c(u,y,14,h)}
        <text x="${_}" y="${r+38}" text-anchor="middle" class="chip-value">${m}</text>
        <text x="${_}" y="${r+56}" text-anchor="middle" class="chip-name">${t.name}</text>
      </g>`})}`}const Tt="fve-flow-confirm-dialog";class Ot extends HTMLElement{constructor(){super(),this._confirmed=!1;const t=this.attachShadow({mode:"open"});t.innerHTML='\n      <style>\n        :host {\n          --dialog-accent: #ffb74d;\n          color: var(--primary-text-color, #e6f4fa);\n          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);\n        }\n        dialog {\n          width: min(420px, calc(100vw - 32px));\n          padding: 0;\n          overflow: hidden;\n          color: inherit;\n          background:\n            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 45%),\n            rgba(7, 16, 25, 0.98);\n          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);\n          border-radius: 18px;\n          box-shadow: 0 0 28px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 20px 64px rgba(0, 0, 0, 0.55);\n        }\n        dialog::backdrop {\n          background: rgba(0, 7, 13, 0.76);\n          backdrop-filter: blur(5px);\n        }\n        .body {\n          padding: 22px 22px 18px;\n        }\n        h2 {\n          display: flex;\n          align-items: center;\n          gap: 10px;\n          margin: 0 0 10px;\n          font-size: 16px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n        }\n        h2::before {\n          content: \'\';\n          width: 9px;\n          height: 9px;\n          flex: 0 0 auto;\n          border-radius: 50%;\n          background: var(--dialog-accent);\n          box-shadow: 0 0 10px var(--dialog-accent);\n        }\n        p {\n          margin: 0;\n          color: var(--secondary-text-color, rgba(220, 235, 245, 0.68));\n          font-size: 14px;\n          line-height: 1.5;\n        }\n        .actions {\n          display: flex;\n          justify-content: flex-end;\n          gap: 10px;\n          padding: 0 22px 20px;\n        }\n        button {\n          padding: 9px 18px;\n          font: inherit;\n          font-size: 13.5px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n          cursor: pointer;\n          border-radius: 10px;\n        }\n        .cancel {\n          color: var(--secondary-text-color, #a8bbc6);\n          background: rgba(255, 255, 255, 0.05);\n          border: 1px solid rgba(255, 255, 255, 0.12);\n        }\n        .cancel:hover,\n        .cancel:focus-visible {\n          color: var(--primary-text-color, #fff);\n          outline: 1px solid rgba(255, 255, 255, 0.3);\n        }\n        .confirm {\n          color: #0a0f16;\n          background: var(--dialog-accent);\n          border: 1px solid var(--dialog-accent);\n          box-shadow: 0 0 14px color-mix(in srgb, var(--dialog-accent) 45%, transparent);\n        }\n        .confirm:hover,\n        .confirm:focus-visible {\n          filter: brightness(1.12);\n          outline: none;\n        }\n      </style>\n      <dialog aria-labelledby="confirm-title">\n        <div class="body">\n          <h2 id="confirm-title"></h2>\n          <p></p>\n        </div>\n        <div class="actions">\n          <button type="button" class="cancel">Zrušit</button>\n          <button type="button" class="confirm"></button>\n        </div>\n      </dialog>\n    ',this._dialog=t.querySelector("dialog"),t.querySelector(".cancel").addEventListener("click",()=>this._dialog.close()),t.querySelector(".confirm").addEventListener("click",()=>{this._confirmed=!0,this._dialog.close()}),this._dialog.addEventListener("click",t=>{t.target===this._dialog&&this._dialog.close()}),this._dialog.addEventListener("close",()=>{this._resolve?.(this._confirmed),this.remove()})}show(t){const e=this.shadowRoot;return e.querySelector("h2").textContent=t.title,e.querySelector("p").textContent=t.message,e.querySelector(".confirm").textContent=t.confirmLabel,t.accent&&this.style.setProperty("--dialog-accent",t.accent),this._dialog.showModal(),new Promise(t=>{this._resolve=t})}}customElements.get(Tt)||customElements.define(Tt,Ot);const Vt="fve-flow-history-dialog";class Nt extends HTMLElement{constructor(){super();const t=this.attachShadow({mode:"open"});t.innerHTML='\n      <style>\n        :host {\n          --dialog-accent: #4fc3f7;\n          color: var(--primary-text-color, #e6f4fa);\n          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);\n        }\n        dialog {\n          width: min(920px, calc(100vw - 32px));\n          max-width: 920px;\n          max-height: calc(100vh - 32px);\n          padding: 0;\n          overflow: hidden;\n          color: inherit;\n          background:\n            radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--dialog-accent) 10%, transparent), transparent 38%),\n            rgba(7, 16, 25, 0.98);\n          border: 1px solid color-mix(in srgb, var(--dialog-accent) 48%, transparent);\n          border-radius: 20px;\n          box-shadow: 0 0 32px color-mix(in srgb, var(--dialog-accent) 18%, transparent), 0 24px 80px rgba(0, 0, 0, 0.55);\n        }\n        dialog::backdrop {\n          background: rgba(0, 7, 13, 0.76);\n          backdrop-filter: blur(5px);\n        }\n        header {\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          min-height: 64px;\n          padding: 0 18px 0 22px;\n          border-bottom: 1px solid rgba(130, 190, 220, 0.12);\n        }\n        .accent {\n          width: 9px;\n          height: 9px;\n          flex: 0 0 auto;\n          border-radius: 50%;\n          background: var(--dialog-accent);\n          box-shadow: 0 0 10px var(--dialog-accent);\n        }\n        h2 {\n          min-width: 0;\n          flex: 1;\n          margin: 0;\n          overflow: hidden;\n          color: var(--primary-text-color, #e6f4fa);\n          font-size: 17px;\n          font-weight: 650;\n          letter-spacing: 0.02em;\n          text-overflow: ellipsis;\n          white-space: nowrap;\n        }\n        .range {\n          color: var(--secondary-text-color, rgba(220, 235, 245, 0.62));\n          font-size: 12px;\n          white-space: nowrap;\n        }\n        button {\n          display: grid;\n          width: 38px;\n          height: 38px;\n          padding: 0;\n          place-items: center;\n          color: var(--secondary-text-color, #a8bbc6);\n          font: inherit;\n          font-size: 25px;\n          line-height: 1;\n          cursor: pointer;\n          background: rgba(255, 255, 255, 0.05);\n          border: 1px solid rgba(255, 255, 255, 0.09);\n          border-radius: 50%;\n        }\n        button:hover,\n        button:focus-visible {\n          color: var(--primary-text-color, #fff);\n          outline: 1px solid var(--dialog-accent);\n        }\n        .chart {\n          min-height: 390px;\n          padding: 12px;\n          overflow: auto;\n        }\n        .chart > * {\n          display: block;\n          width: 100%;\n        }\n        @media (max-width: 600px) {\n          dialog {\n            width: calc(100vw - 16px);\n            max-height: calc(100vh - 16px);\n            border-radius: 16px;\n          }\n          header {\n            min-height: 58px;\n            padding: 0 10px 0 16px;\n          }\n          h2 {\n            font-size: 15px;\n          }\n          .range {\n            display: none;\n          }\n          .chart {\n            min-height: 320px;\n            padding: 8px;\n          }\n        }\n      </style>\n      <dialog aria-labelledby="history-title">\n        <header>\n          <span class="accent" aria-hidden="true"></span>\n          <h2 id="history-title"></h2>\n          <span class="range">posledních 48 hodin</span>\n          <button type="button" aria-label="Zavřít graf" title="Zavřít">×</button>\n        </header>\n        <div class="chart"></div>\n      </dialog>\n    ',this._dialog=t.querySelector("dialog"),this._chartHost=t.querySelector(".chart"),t.querySelector("button").addEventListener("click",()=>this._dialog.close()),this._dialog.addEventListener("click",t=>{t.target===this._dialog&&this._dialog.close()}),this._dialog.addEventListener("close",()=>this.remove())}show(t,e,n,o){this.shadowRoot.querySelector("h2").textContent=t,this.shadowRoot.querySelector(".range").textContent=e,this.style.setProperty("--dialog-accent",n),this._chartHost.replaceChildren(o),this._dialog.showModal()}}async function Rt(t,e,n=60){if(!t.callApi)return[];const o=`history/period/${new Date(Date.now()-60*n*1e3).toISOString()}?filter_entity_id=${encodeURIComponent(e)}&minimal_response&no_attributes`;try{const e=await t.callApi("GET",o),n=Array.isArray(e)?e[0]:void 0;if(!Array.isArray(n))return[];const s=[];for(const t of n){if(!t||"object"!=typeof t)continue;const e=t,n=parseFloat(e.state??""),o=new Date(e.last_changed??e.last_updated??"").getTime();Number.isFinite(n)&&Number.isFinite(o)&&s.push([o,n])}return s}catch{return[]}}customElements.get(Vt)||customElements.define(Vt,Nt);const Ut={entity:{domain:"sensor"}},Dt={entity:{domain:"switch"}},It={text:{}},Wt={icon:{}},Bt={boolean:{}},Zt=(t,e,n=1)=>({number:{min:t,max:e,step:n,mode:"box"}}),qt=[{name:"yellow_from",selector:Zt(0,2e4,50)},{name:"green_from",selector:Zt(0,2e4,50)},{name:"bar_max",selector:Zt(100,3e4,100)},{name:"severity_invert",selector:Bt}],Gt=[{name:"yellow_from",selector:Zt(0,100,1)},{name:"green_from",selector:Zt(0,100,1)}],Kt=[{name:"title",selector:It},{name:"pv",type:"expandable",title:"FVE panely",icon:"mdi:solar-power",schema:[{name:"power",required:!0,selector:Ut},{name:"energy_today",selector:Ut},{name:"energy_total",selector:Ut},{name:"max_power_today",selector:Ut},{name:"name",selector:It,custom_label:"Vlastní název FVE panelů"},...qt]},{name:"pv",type:"expandable",title:"MPPT regulátor",icon:"mdi:current-dc",schema:[{name:"voltage",selector:Ut},{name:"current",selector:Ut},{name:"mppt_state",selector:Ut},{name:"mppt_switch",selector:Dt},{name:"mppt_name",selector:It,custom_label:"Vlastní název MPPT regulátoru"}]},{name:"battery",type:"expandable",icon:"mdi:battery-high",schema:[{name:"soc",required:!0,selector:Ut},{name:"power",selector:Ut},{name:"voltage",selector:Ut},{name:"current",selector:Ut},{name:"temperature",selector:Ut},{name:"soh",selector:Ut},{name:"runtime",selector:Ut},{name:"cycles",selector:Ut},{name:"time_to_full",selector:Ut},{name:"capacity",selector:Ut},{name:"invert",selector:Bt},{name:"name",selector:It,custom_label:"Vlastní název baterie"},...Gt]},{name:"inverter",type:"expandable",icon:"mdi:sine-wave",schema:[{name:"power",selector:Ut},{name:"state",selector:Ut},{name:"voltage",selector:Ut},{name:"current",selector:Ut},{name:"load_power",selector:Ut},{name:"days_in_service",selector:Ut},{name:"fan_switch",selector:Dt},{name:"name",selector:It,custom_label:"Vlastní název měniče"},...qt]},{name:"grid",type:"expandable",icon:"mdi:transmission-tower",schema:[{name:"power",selector:Ut},{name:"phase_a",selector:Ut},{name:"phase_b",selector:Ut},{name:"phase_c",selector:Ut},{name:"energy_total",selector:Ut},{name:"energy_today",selector:Ut},{name:"name",selector:It,custom_label:"Vlastní název sítě"},...qt]},{name:"solcast",type:"expandable",icon:"mdi:weather-sunny",schema:[{name:"power_now",selector:Ut},{name:"remaining_today",selector:Ut},{name:"total_today",selector:Ut},{name:"total_tomorrow",selector:Ut},...qt]},{name:"options",type:"expandable",icon:"mdi:tune",schema:[{name:"max_flow_w",selector:Zt(500,2e4,100)},{name:"deadband_w",selector:Zt(0,500,5)},{name:"dots",selector:Zt(1,8)},{name:"min_duration",selector:Zt(.5,10,.1)},{name:"max_duration",selector:Zt(1,20,.5)},{name:"animation",selector:Bt},{name:"sparklines",selector:Bt}]}],Jt=[{name:"name",required:!0,selector:It,custom_label:"Název patra"},{name:"floor_grid",type:"expandable",flatten:!0,expanded:!0,title:"Grid (síť) — Shelly *-GRID-AC-OUT",icon:"mdi:transmission-tower",schema:[{name:"grid_power",selector:Ut},{name:"grid_energy",selector:Ut},{name:"phase_a_entity",selector:Ut},{name:"phase_a_name",selector:It},{name:"phase_a_icon",selector:Wt},{name:"phase_b_entity",selector:Ut},{name:"phase_b_name",selector:It},{name:"phase_b_icon",selector:Wt},{name:"phase_c_entity",selector:Ut},{name:"phase_c_name",selector:It},{name:"phase_c_icon",selector:Wt}]},{name:"floor_fve",type:"expandable",flatten:!0,expanded:!0,title:"FVE (ostrov)",icon:"mdi:solar-power",schema:[{name:"island_power",selector:Ut},{name:"island_energy",selector:Ut}]}],Yt={title:"Titulek karty",pv:"FVE / MPPT",mppt_switch:"Spínač MPPT (switch) — ovládací tlačítko",fan_switch:"Spínač chlazení měniče (switch) — ovládací tlačítko",battery:"Baterie",inverter:"Měnič",grid:"Síť (grid)",solcast:"Předpověď Solcast",options:"Chování a animace",power:"Výkon (W)",energy_today:"Energie dnes (kWh)",energy_total:"Energie celkem (kWh)",max_power_today:"Maximální výkon dnes (W)",voltage:"Napětí (V)",current:"Proud (A)",mppt_state:"Režim / stav MPPT",soc:"Nabití SoC (%)",temperature:"Teplota",soh:"Zdraví SoH (%)",runtime:"Odhadovaná výdrž",cycles:"Počet nabíjecích cyklů",time_to_full:"Doba do plného nabití",capacity:"Instalovaná kapacita",invert:"Obrátit znaménko výkonu baterie",state:"Stav měniče",load_power:"Ostrovní spotřeba — kritické zátěže (W)",days_in_service:"Počet dní v provozu",name:"Vlastní název",phase_a:"Fáze L1",phase_b:"Fáze L2",phase_c:"Fáze L3",phase_a_entity:"Entita výkonu L1 (W)",phase_a_name:"Vlastní název L1 (např. Pračka)",phase_a_icon:"Ikona L1",phase_b_entity:"Entita výkonu L2 (W)",phase_b_name:"Vlastní název L2 (např. Sušička)",phase_b_icon:"Ikona L2",phase_c_entity:"Entita výkonu L3 (W)",phase_c_name:"Vlastní název L3 (např. Sporák)",phase_c_icon:"Ikona L3",power_now:"Predikovaný výkon teď (W)",remaining_today:"Zbývá dnes (kWh)",total_today:"Dnes celkem (kWh)",total_tomorrow:"Zítra celkem (kWh)",max_flow_w:"Výkon pro plnou rychlost animace (W)",deadband_w:"Mrtvá zóna — pod tímto výkonem je linka neaktivní (W)",dots:"Počet svítících teček na jedné aktivní lince",min_duration:"Nejrychlejší oběh tečky — při max. výkonu (s)",max_duration:"Nejpomalejší oběh tečky — těsně nad mrtvou zónou (s)",animation:"Animace pulzujících teček zapnuté",sparklines:"Mini trendové křivky v rozích uzlů",yellow_from:"Žlutá od hodnoty (pod ní červená)",green_from:"Zelená od hodnoty",bar_max:"Rozsah progress baru (max)",severity_invert:"Obrátit barvy (vysoká hodnota = špatná)",grid_power:"Výkon ze sítě (W) — nepovinné, jinak součet fází",grid_energy:"Energie ze sítě (kWh)",island_power:"Výkon z FVE (W)",island_energy:"Energie z FVE (kWh)"},Qt={mppt_switch:"Když je vyplněno, zobrazí se v panelu MPPT tlačítko Zapnout/Vypnout. Přepnutí je chráněné potvrzovacím dialogem.",fan_switch:"Když je vyplněno, zobrazí se v panelu měniče tlačítko Zapnout/Vypnout chlazení (např. chytrá zásuvka s ventilátorem). Přepíná se okamžitě bez potvrzení.",max_flow_w:'Výkon, při kterém pulzy na lince běží nejrychleji (rychlost je od "mrtvé zóny" po tuto hodnotu plynulá). Nastav podle reálné špičky tvého systému, např. 5000 W pro měnič 5 kW.',deadband_w:'Pod touto hodnotou je tok energie tak malý, že se linka vykreslí jako klidná/šedá bez pulzů — potlačí to "věčné" mihotání kvůli šumu měření.',dots:'Kolik světelných teček se najednou pohybuje po jedné aktivní lince. Víc teček = hustší, "plnější" tok při vysokém výkonu.',min_duration:"Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon na hraně `max_flow_w` (nejrychlejší možný pohyb).",max_duration:'Čas v sekundách, za který jedna tečka oběhne celou linku, když je výkon jen kousek nad `deadband_w` (nejpomalejší, "sotva tekoucí" pohyb).',animation:"Vypnutím se pulzující tečky nekreslí vůbec — čísla, barvy a stavy uzlů se ale dál aktualizují normálně. Vhodné na slabší zařízení nebo pokud animace nechceš.",sparklines:"Malá křivka trendu za poslední hodinu v pravém horním rohu uzlů FVE, baterie (SoC), měnič a síť. Data se tahají z historie HA a obnovují se každých 5 minut."};let Xt=class extends ct{constructor(){super(...arguments),this._computeLabel=t=>t.custom_label??Yt[t.name]??t.name,this._computeHelper=t=>Qt[t.name]}setConfig(t){this._config=t}render(){if(!this.hass||!this._config)return W``;const t=this._config.floors??[];return W`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${Kt}
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
                .schema=${Jt}
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
    `}_mainChanged(t){t.stopPropagation();const e=t.detail.value;this._emit({...e,floors:this._config?.floors??[]})}_floorChanged(t,e){t.stopPropagation();const n=[...this._config?.floors??[]];n[e]=t.detail.value,this._emit({...this._config,floors:n})}_addFloor(){const t=[...this._config?.floors??[],{name:`Patro ${(this._config?.floors?.length??0)+1}`}];this._emit({...this._config,floors:t})}_removeFloor(t){const e=(this._config?.floors??[]).filter((e,n)=>n!==t);this._emit({...this._config,floors:e})}_emit(t){this._config=t,Mt(this,"config-changed",{config:t})}};Xt.styles=r`
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
  `,t([mt({attribute:!1})],Xt.prototype,"hass",void 0),t([ut()],Xt.prototype,"_config",void 0),Xt=t([dt("fve-flow-card-editor")],Xt);const te=t=>t*Math.PI/180;function ee(t,e,n,o){const s=te(o);return{x:t+n*Math.cos(s),y:e+n*Math.sin(s)}}const ne=t=>(Math.cos(te(t))+1)/2,oe="fve-gauge-gradient";function se(t,e,n,o,s,a,r,i,l=14){const c=Math.max(1e-6,a-s),h=t=>180+(Math.max(s,Math.min(a,t))-s)/c*180,d=h(r.yellowFrom),p=Math.max(h(r.greenFrom),d),_=ee(t,e,n,h(o)),m=.05,u=ne(d),y=ne(p);let f=0;const g=[{offset:0,color:"#ff5252"},{offset:u-m,color:"#ff5252"},{offset:u+m,color:"#ffd740"},{offset:y-m,color:"#ffd740"},{offset:y+m,color:"#00e676"},{offset:1,color:"#00e676"}].map(t=>{const e=Math.max(f,Math.min(1,t.offset));return f=e,{offset:e,color:t.color}});return B`
    <defs>
      <linearGradient id="${oe}" gradientUnits="userSpaceOnUse"
        x1="${(t-n).toFixed(2)}" y1="${e}" x2="${(t+n).toFixed(2)}" y2="${e}">
        ${g.map(t=>B`<stop offset="${(100*t.offset).toFixed(1)}%" stop-color="${t.color}"/>`)}
      </linearGradient>
    </defs>
    <path d="${function(t,e,n,o,s){const a=ee(t,e,n,o),r=ee(t,e,n,s);return`M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${n} ${n} 0 0 1 ${r.x.toFixed(2)} ${r.y.toFixed(2)}`}(t,e,n,180,360)}" fill="none" stroke="url(#${oe})"
      stroke-width="${l}" stroke-linecap="round" opacity="0.55"/>
    <circle cx="${_.x.toFixed(2)}" cy="${_.y.toFixed(2)}" r="${l/2+3}"
      fill="${i}" stroke="rgba(8,14,20,0.9)" stroke-width="2.5"
      style="filter: drop-shadow(0 0 7px ${i})"/>`}const ae=18e5;function re(t,e,n){if(!t.length)return[];const o=new Map;for(const[s,a]of t){if(s<e||s>n)continue;const t=Math.floor((s-e)/ae),r=o.get(t)??{sum:0,count:0};r.sum+=a,r.count+=1,o.set(t,r)}return[...o.entries()].sort(([t],[e])=>t-e).map(([t,n])=>[e+t*ae+9e5,n.sum/n.count])}function ie(t){if(t.length<2)return"";if(2===t.length){const[[e,n],[o,s]]=t;return`M ${e.toFixed(1)} ${n.toFixed(1)} L ${o.toFixed(1)} ${s.toFixed(1)}`}let e=`M ${t[0][0].toFixed(1)} ${t[0][1].toFixed(1)}`;for(let n=0;n<t.length-1;n++){const o=t[0===n?0:n-1],s=t[n],a=t[n+1],r=t[n+2]??a,i=s[0]+(a[0]-o[0])/6,l=s[1]+(a[1]-o[1])/6,c=a[0]-(r[0]-s[0])/6,h=a[1]-(r[1]-s[1])/6;e+=` C ${i.toFixed(1)} ${l.toFixed(1)}, ${c.toFixed(1)} ${h.toFixed(1)}, ${a[0].toFixed(1)} ${a[1].toFixed(1)}`}return e}const le={entity:{domain:"sensor"}},ce={text:{}},he=(t,e,n=1)=>({number:{min:t,max:e,step:n,mode:"box"}}),de=[{name:"title",selector:ce},{name:"battery",type:"expandable",icon:"mdi:battery-high",schema:[{name:"soc",required:!0,selector:le},{name:"power",selector:le},{name:"runtime",selector:le},{name:"time_to_full",selector:le},{name:"invert",selector:{boolean:{}}},{name:"yellow_from",selector:he(0,100,1)},{name:"green_from",selector:he(0,100,1)},{name:"name",selector:ce,custom_label:"Vlastní název baterie"}]},{name:"solar",type:"expandable",flatten:!0,title:"FVE a Solcast predikce",icon:"mdi:solar-power",schema:[{name:"pv_power",selector:le,custom_label:'Aktuální výkon FVE (W) — „Realita"'},{name:"solcast_power_now",selector:le,custom_label:'Predikovaný výkon teď (W) — „Predikce"'},{name:"solcast_total_today",selector:le,custom_label:"Entita s dnešní Solcast predikcí (zdroj grafu)"}]},{name:"navigation",type:"expandable",flatten:!0,title:"Navigace",icon:"mdi:gesture-tap",schema:[{name:"navigation_path",selector:ce,custom_label:"Cesta velkého dashboardu"}]}],pe={title:"Titulek karty",battery:"Baterie",soc:"Nabití SoC (%)",power:"Výkon baterie (W)",runtime:"Odhadovaná výdrž",time_to_full:"Doba do plného nabití",invert:"Obrátit znaménko výkonu baterie",yellow_from:"Žlutá od hodnoty (pod ní červená)",green_from:"Zelená od hodnoty",name:"Vlastní název"},_e={yellow_from:"Výchozí 15 % — pod touto hranicí je gauge červený.",green_from:"Výchozí 40 % — od této hranice je gauge zelený.",invert:"Zapni, pokud tvá baterie hlásí kladný výkon při vybíjení (obrácená konvence než Victron).",solcast_total_today:'Stejná entita jako u velké karty ("Dnes celkem") — karta si z jejího atributu detailedForecast sama vybere dnešní hodiny pro graf.',navigation_path:"Cesta velkého FVE Flow dashboardu, např. /lovelace/fve-flow — najdeš ji v adresním řádku prohlížeče, když máš velkou kartu otevřenou. Bez vyplnění klik na kartu otevře jen historii baterie."};let me=class extends ct{constructor(){super(...arguments),this._computeLabel=t=>t.custom_label??pe[t.name]??t.name,this._computeHelper=t=>_e[t.name]}setConfig(t){this._config=t}render(){return this.hass&&this._config?W`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${de}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        @value-changed=${this._changed}
      ></ha-form>
    `:W``}_changed(t){t.stopPropagation();const e=t.detail.value;this._config=e,Mt(this,"config-changed",{config:e})}};me.styles=r`
    :host {
      display: block;
    }
    ha-form {
      display: block;
    }
  `,t([mt({attribute:!1})],me.prototype,"hass",void 0),t([ut()],me.prototype,"_config",void 0),me=t([dt("fve-flow-mini-card-editor")],me);const ue="#00e676",ye="#ffd54f";let fe=class extends ct{constructor(){super(...arguments),this._actual=[]}setConfig(t){if(!t)throw new Error("Chybí konfigurace");this._config=t}connectedCallback(){super.connectedCallback(),this._historyTimer=window.setInterval(()=>{this._refreshHistory()},3e5)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._historyTimer&&(window.clearInterval(this._historyTimer),this._historyTimer=void 0)}updated(t){if(super.updated(t),!this.hass||!this._config)return;const e=this._config.pv_power;e!==this._historyEntity&&(this._historyEntity=e,this._refreshHistory())}_minutesSinceMidnight(){const t=new Date,e=new Date(t);return e.setHours(0,0,0,0),Math.max(1,Math.round((t.getTime()-e.getTime())/6e4))}async _refreshHistory(){const t=this._config?.pv_power;this.hass&&t?this._actual=await Rt(this.hass,t,this._minutesSinceMidnight()):this._actual=[]}_forecastPoints(){const t=this._config?.solcast_total_today,e=t?this.hass?.states[t]:void 0,n=e?.attributes.detailedForecast;if(!Array.isArray(n))return[];const o=new Date;o.setHours(0,0,0,0);const s=o.getTime(),a=s+864e5,r=[];for(const t of n){if(!t||"object"!=typeof t)continue;const e=t,n=new Date(e.period_start??"").getTime(),o=1e3*Number(e.pv_estimate);Number.isFinite(n)&&Number.isFinite(o)&&n>=s&&n<=a&&r.push([n,o])}return r.sort((t,e)=>t[0]-e[0])}_handleClick(){const t=this._config?.navigation_path?.trim();if(t)return window.history.pushState(null,"",t),void window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}));St(this,this._config?.battery?.soc)}getCardSize(){return 6}getGridOptions(){return{columns:6,rows:5,min_rows:4}}static async getConfigElement(){return document.createElement("fve-flow-mini-card-editor")}static getStubConfig(){return{title:"FVE přehled",battery:{soc:"sensor.pylontech_battery_id_512_nabijeni",power:"sensor.pylontech_battery_id_512_vykon",runtime:"sensor.baterie_odhadovana_vydrz_2",time_to_full:"sensor.baterie_doba_do_plneho_nabiti"},pv_power:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky",solcast_power_now:"sensor.solcast_pv_forecast_power_now",solcast_total_today:"sensor.solcast_pv_forecast_forecast_today",navigation_path:"/lovelace/fve-flow"}}render(){const t=this._config;if(!t)return W``;if(!this.hass)return W`<ha-card></ha-card>`;const e=t.battery??{},n=$t(this.hass,e.soc,0),o=e.yellow_from??15,s=Math.max(e.green_from??40,o),a=xt(n,{yellow_from:o,green_from:s,severity_invert:e.severity_invert})??ue,r=$t(this.hass,e.power),i=(e.invert?-r:r)>=25,l=$t(this.hass,t.pv_power),c=$t(this.hass,t.solcast_power_now),h=400,d=200,p=114,_=[];return e.runtime&&_.push(`Odhadovaná výdrž ${At(this.hass,e.runtime)}`),i&&e.time_to_full&&_.push(`Do plného nabití ${At(this.hass,e.time_to_full)}`),W`
      <ha-card @click=${()=>this._handleClick()}>
        <svg viewBox="0 0 ${h} ${344}" preserveAspectRatio="xMidYMid meet" role="img">
          ${t.title?B`<text class="card-title" x="${d}" y="20" text-anchor="middle">${t.title}</text>`:q}

          ${se(d,p,74,n,0,100,{yellowFrom:o,greenFrom:s},a)}
          <text class="gauge-value" x="${d}" y="${120}" text-anchor="middle" style="fill: ${a}">
            ${e.soc?`${Math.round(n)} %`:"—"}
          </text>
          <text class="gauge-label" x="${d}" y="${144}" text-anchor="middle">
            ${e.name||"Stav baterie"}
          </text>
          ${_.map((t,e)=>B`
              <text class="info-line" x="${d}" y="${166+18*e}" text-anchor="middle">${t}</text>
            `)}

          <line x1="24" y1="202" x2="${376}" y2="202" stroke="rgba(148,170,190,0.14)" stroke-width="1"/>

          <text class="headline-value" x="${.28*h}" y="234" text-anchor="middle" style="fill: ${ue}">
            ${t.pv_power?Et(l):"—"}
          </text>
          <text class="headline-label" x="${.28*h}" y="252" text-anchor="middle">Realita</text>

          <text class="headline-value" x="${288}" y="234" text-anchor="middle" style="fill: ${ye}">
            ${t.solcast_power_now?Et(c):"—"}
          </text>
          <text class="headline-label" x="${288}" y="252" text-anchor="middle">Predikce</text>

          ${function(t,e,n,o,s,a,r){if(t.length<2&&e.length<2)return q;const i=new Date;i.setHours(0,0,0,0);const l=i.getTime(),c=l+864e5,h=Date.now(),d=re(t,l,c),p=re(e,l,c),_=Math.max(1,...d.map(([,t])=>t),...p.map(([,t])=>t)),m=([t,e])=>[n+Math.max(0,Math.min(1,(t-l)/(c-l)))*s,o+a-Math.max(0,Math.min(1,e/_))*a],u=d.map(m),y=p.map(m),f=u.length>1?ie(u):"",g=y.length>1?ie(y):"",x=f?`${f} L ${u[u.length-1][0].toFixed(1)} ${(o+a).toFixed(1)} L ${u[0][0].toFixed(1)} ${(o+a).toFixed(1)} Z`:"",$=n+Math.max(0,Math.min(1,(h-l)/(c-l)))*s;return B`
    <g>
      <line x1="${n}" y1="${o+a}" x2="${n+s}" y2="${o+a}" stroke="rgba(148,170,190,0.18)" stroke-width="1"/>
      ${[0,6,12,18,24].map(t=>{const e=n+t/24*s;return B`
          <line x1="${e}" y1="${o}" x2="${e}" y2="${o+a}" stroke="rgba(148,170,190,0.07)" stroke-width="1"/>
          <text x="${e}" y="${o+a+13}" text-anchor="middle" class="chart-axis">${String(t).padStart(2,"0")}</text>
        `})}
      ${$>=n&&$<=n+s?B`<line x1="${$.toFixed(1)}" y1="${o}" x2="${$.toFixed(1)}" y2="${o+a}"
            stroke="rgba(226,240,248,0.35)" stroke-width="1" stroke-dasharray="3 4"/>`:q}
      ${x?B`<path d="${x}" fill="${r.actual}" opacity="0.16"/>`:q}
      ${g?B`<path d="${g}" fill="none" stroke="${r.forecast}" stroke-width="2"
            stroke-dasharray="5 4" stroke-linecap="round" opacity="0.85"/>`:q}
      ${f?B`<path d="${f}" fill="none" stroke="${r.actual}" stroke-width="2" stroke-linecap="round"/>`:q}
    </g>`}(this._actual,this._forecastPoints(),24,266,352,56,{actual:ue,forecast:ye})}
        </svg>
      </ha-card>
    `}};var ge;fe.styles=r`
    :host {
      display: block;
      height: 100%;
    }
    ha-card {
      height: 100%;
      overflow: hidden;
      padding: 4px;
      cursor: pointer;
      background:
        radial-gradient(1100px 700px at 18% -10%, #122433 0%, transparent 60%),
        radial-gradient(900px 600px at 95% 105%, #0d1d2e 0%, transparent 55%),
        linear-gradient(160deg, #0b141d 0%, #070c12 100%);
      border: 1px solid rgba(120, 180, 210, 0.08);
    }
    svg {
      display: block;
      /* Vyplní přesně tolik místa, kolik dá HA grid — obsah (viewBox)
         se pak jen přiměřeně zmenší/zvětší (preserveAspectRatio="meet"
         v render()), takže se nikdy neuseká spodek karty. */
      width: 100%;
      height: 100%;
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
    .gauge-value {
      font-size: 30px;
      font-weight: 700;
    }
    .gauge-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .info-line {
      font-size: 13px;
      fill: rgba(226, 240, 248, 0.65);
    }
    .headline-value {
      font-size: 22px;
      font-weight: 700;
    }
    .headline-label {
      font-size: 11.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      fill: rgba(226, 240, 248, 0.45);
    }
    .chart-axis {
      font-size: 10px;
      fill: rgba(226, 240, 248, 0.35);
    }
  `,t([mt({attribute:!1})],fe.prototype,"hass",void 0),t([ut()],fe.prototype,"_config",void 0),t([ut()],fe.prototype,"_actual",void 0),fe=t([dt("fve-flow-mini-card")],fe),window.customCards=window.customCards||[],window.customCards.push({type:"fve-flow-mini-card",name:"FVE Flow Mini Card",description:"Kompaktní karta: baterie jako gauge s výdrží, výroba FVE vs. Solcast predikce. Klik naviguje na velký FVE Flow dashboard.",preview:!1,documentationURL:"https://github.com/elvisek/fve-flow-card"});const xe="#00e676",$e="#00e676",ve="#4fc3f7",be="#e040fb",we="#ffb74d",ke="#69f0ae",Ee="#ffb74d",Ce={L1:{color:"#f5f5f5",border:"rgba(245,245,245,0.28)"},L2:{color:"#78909c",border:"rgba(120,144,156,0.35)"},L3:{color:"#b87333",border:"rgba(184,115,51,0.38)"}};console.info("%c FVE-FLOW-CARD %c v0.5.1 ","color: #0a0f16; background: #00e676; font-weight: 700;","color: #00e676; background: #0a0f16; font-weight: 700;");let Ae=ge=class extends ct{constructor(){super(...arguments),this._spark=new Map,this._sparkEntities=[],this._narrow=!1}setConfig(t){if(!t)throw new Error("Chybí konfigurace");this._config=t}connectedCallback(){super.connectedCallback(),this._sparkTimer=window.setInterval(()=>{this._refreshSparklines()},3e5),this._resizeObserver=new ResizeObserver(t=>{const e=t[0]?.contentRect.width;void 0!==e&&(this._narrow=e<ge.NARROW_BREAKPOINT)}),this._resizeObserver.observe(this)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._sparkTimer&&(window.clearInterval(this._sparkTimer),this._sparkTimer=void 0),this._resizeObserver?.disconnect(),this._resizeObserver=void 0}updated(t){if(super.updated(t),this.toggleAttribute("narrow",this._narrow),!this.hass||!this._config)return;const e=this._sparklineEntities(),n=e.length===this._sparkEntities.length&&e.every((t,e)=>t===this._sparkEntities[e]);n||(this._sparkEntities=e,this._refreshSparklines())}_sparklineEntities(){const t=this._config;return t&&!1!==t.options?.sparklines?[t.pv?.power,t.battery?.soc,t.inverter?.power,t.grid?.power].filter(t=>!!t):[]}async _refreshSparklines(){if(!this.hass)return;const t=this._sparklineEntities();if(!t.length)return void(this._spark.size&&(this._spark=new Map));const e=this.hass,n=await Promise.all(t.map(t=>Rt(e,t))),o=new Map;t.forEach((t,e)=>o.set(t,n[e])),this._spark=o}_sparklineNode(t,e,n){if(!t)return q;const o=this._spark.get(t);return o?.length?function(t,e,n,o,s,a){if(t.length<2)return q;const r=t.map(([,t])=>t),i=Math.min(...r),l=Math.max(...r)-i,c=t[0][0],h=t[t.length-1][0],d=Math.max(1,h-c),p=t.map(([t,a])=>[e+(t-c)/d*o,0===l?n+s/2:n+s-(a-i)/l*s]),_=p.map(([t,e],n)=>`${0===n?"M":"L"} ${t.toFixed(1)} ${e.toFixed(1)}`).join(" "),m=(n+s).toFixed(1),u=`${_} L ${p[p.length-1][0].toFixed(1)} ${m} L ${p[0][0].toFixed(1)} ${m} Z`;return B`
    <g style="pointer-events: none">
      <path d="${u}" fill="${a}" opacity="0.12"/>
      <path d="${_}" fill="none" stroke="${a}" stroke-width="1.5"
        stroke-linejoin="round" stroke-linecap="round" opacity="0.75"/>
    </g>`}(o,e.x+e.w-104,e.y+34,90,20,n):q}getCardSize(){return 12}getGridOptions(){return{columns:"full",rows:8,min_rows:4}}static async getConfigElement(){return document.createElement("fve-flow-card-editor")}static getStubConfig(){return{title:"Tok energie",pv:{power:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynosovy_vykon_fotovoltaiky",energy_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_vynos_dnes",energy_total:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_celkovy_vynos",max_power_today:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_maximalni_vykon_dnes",voltage:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_napeti_fv_sbernice",current:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_proud_dc_bateriove_sbernice",mppt_state:"sensor.smartsolar_mppt_ve_can_250_100_rev2_id_273_provozni_rezim_mppt"},battery:{soc:"sensor.pylontech_battery_id_512_nabijeni",power:"sensor.pylontech_battery_id_512_vykon",voltage:"sensor.pylontech_battery_id_512_napeti_dc_sbernice",current:"sensor.pylontech_battery_id_512_proud_dc_sbernice",temperature:"sensor.pylontech_battery_id_512_teplota",soh:"sensor.pylontech_battery_id_512_zdravi",runtime:"sensor.baterie_odhadovana_vydrz_2",time_to_full:"sensor.baterie_doba_do_plneho_nabiti",capacity:"sensor.pylontech_battery_id_512_instalovana_kapacita"},inverter:{power:"sensor.multiplus_ii_48_5000_70_50_id_275_vystupni_vykon_l1",state:"sensor.multiplus_ii_48_5000_70_50_id_275_stav",load_power:"sensor.gx_device_kriticke_zateze_na_l1",days_in_service:"sensor.fve_pocet_dni_v_provozu",name:"MultiPlus-II"},grid:{power:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_vykon",phase_a:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_a_vykon",phase_b:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_b_vykon",phase_c:"sensor.1np_vstupni_chodba_dub_1nb_grid_ac_in_phase_c_vykon",energy_total:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_in_energie",name:"Síť ČEZ"},solcast:{power_now:"sensor.solcast_pv_forecast_power_now",remaining_today:"sensor.solcast_pv_forecast_forecast_remaining_today",total_today:"sensor.solcast_pv_forecast_forecast_today",total_tomorrow:"sensor.solcast_pv_forecast_forecast_tomorrow"},floors:[{name:"0NP",grid_energy:"sensor.0np_pradelna_dub_0np_grid_ac_out_energie",phase_a_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.0np_pradelna_dub_0np_grid_ac_out_phase_c_vykon"},{name:"1NP",grid_energy:"sensor.dub_1np_grid_ac_out_energie",phase_a_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_a_vykon",phase_b_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_b_vykon",phase_c_entity:"sensor.1np_vstupni_chodba_dub_1np_grid_ac_out_phase_c_vykon"}]}}_flowBase(){const t=this._config?.options??{};return{deadband:t.deadband_w??25,maxPower:t.max_flow_w??5e3,minDuration:t.min_duration??1.4,maxDuration:t.max_duration??6,dots:t.dots??3,animate:!1!==t.animation}}_entityName(t,e){const n=this.hass?.states[t]?.attributes.friendly_name;return e||("string"==typeof n?n:t)}_historySeries(t,e,n){return t?[{entity:t,name:e,color:n}]:[]}async _openHistory(t,e,n,o){if(!this.hass||!t.length)return;const s=await async function(t){if(!t.series.length)return!1;try{if(customElements.get("apexcharts-card")||await Promise.race([customElements.whenDefined("apexcharts-card"),new Promise(t=>window.setTimeout(t,1500))]),!customElements.get("apexcharts-card"))return console.warn("[FVE Flow Card] apexcharts-card není zaregistrovaná."),!1;const e={type:"custom:apexcharts-card",graph_span:"48h",...t.spanOffset?{span:{offset:t.spanOffset}}:{},update_interval:"1min",header:{show:!1},now:{show:!0,label:"Nyní"},apex_config:{chart:{height:360,background:"transparent",animations:{enabled:!0,easing:"easeinout",speed:500}},legend:{show:t.series.length>1,position:"top",horizontalAlign:"left"},grid:{borderColor:"rgba(148, 170, 190, 0.12)"},tooltip:{shared:!0,intersect:!1}},series:t.series.map(t=>({entity:t.entity,name:t.name,color:t.color,type:"area",curve:"smooth",stroke_width:2,stroke_dash:t.strokeDash??0,opacity:t.opacity??.22,extend_to:t.extendTo??"end",...t.dataGenerator?{data_generator:t.dataGenerator}:{fill_raw:t.fill??"last",group_by:{func:"avg",duration:"5min",fill:t.fill??"last"}},show:{extremas:!0,in_header:!1}}))},n=document.createElement("apexcharts-card");if("function"!=typeof n.setConfig)return!1;n.setConfig(e),n.hass=t.hass,n.style.setProperty("--ha-card-background","transparent"),n.style.setProperty("--card-background-color","transparent"),n.style.setProperty("--ha-card-box-shadow","none");const o=document.createElement(Vt);return document.body.append(o),o.show(t.title,t.rangeLabel||"posledních 48 hodin",t.series[0].color,n),!0}catch(t){return console.warn("[FVE Flow Card] Nepodařilo se otevřít 48h graf, používám nativní historii.",t),!1}}({hass:this.hass,title:e,series:t,spanOffset:n,rangeLabel:o});s||St(this,t[0].entity)}_openEntity(t,e,n){t&&this._openHistory(this._historySeries(t,this._entityName(t,e),n),e)}_openSolcastHistory(t){if(!t.power_now)return;const e=[t.total_today,t.total_tomorrow].filter(t=>!!t);if(!e.length)return void this._openEntity(t.power_now,"Předpověď Solcast","#ffd54f");const n=`\n      const entityIds = ${JSON.stringify(e)};\n      const now = Date.now();\n      const forecastEnd = now + 24 * 60 * 60 * 1000;\n      return entityIds\n        .flatMap((entityId) => {\n          const forecastEntity = hass.states[entityId];\n          return forecastEntity && Array.isArray(forecastEntity.attributes.detailedForecast)\n            ? forecastEntity.attributes.detailedForecast\n            : [];\n        })\n        .map((item) => {\n          const timestamp = new Date(item.period_start).getTime();\n          const watts = Number(item.pv_estimate) * 1000;\n          return [timestamp, watts];\n        })\n        .filter(([timestamp, watts]) =>\n          timestamp >= now - 30 * 60 * 1000 &&\n          timestamp <= forecastEnd &&\n          Number.isFinite(watts)\n        )\n        .map(([timestamp, watts]) => [Math.max(timestamp, now), watts]);\n    `;this._openHistory([{entity:t.power_now,name:"Skutečnost",color:"#4fc3f7",opacity:.18,extendTo:"now",fill:"null"},{entity:e[0],name:"Predikce",color:"#ffd54f",dataGenerator:n,strokeDash:5,opacity:.12,extendTo:!1}],"Solcast · skutečnost a predikce","+24h","24 h historie · 24 h predikce")}_openFloorHistory(t,e){const n=`${t.name||"Patro"} · výkon`,o=[];t.grid_power?o.push({entity:t.grid_power,name:"Síť",color:ve}):e.forEach(t=>{o.push({entity:t.entity,name:t.name||t.label,color:Ce[t.label]?.color??ve})}),t.island_power&&o.push({entity:t.island_power,name:"FVE",color:$e}),this._openHistory(o,n)}_gridPhases(t){return[[t.phase_a,"L1"],[t.phase_b,"L2"],[t.phase_c,"L3"]].filter(([t])=>!!t).map(([t,e])=>({entity:t,name:e,icon:"mdi:flash",label:e}))}_phases(t){const e=[],n=[[t.phase_a_entity,t.phase_a_name,t.phase_a_icon,"L1"],[t.phase_b_entity,t.phase_b_name,t.phase_b_icon,"L2"],[t.phase_c_entity,t.phase_c_name,t.phase_c_icon,"L3"]];for(const[t,o,s,a]of n)t&&e.push({entity:t,name:o||a,icon:s||"mdi:flash",label:a});return e}_switchOn(t){return"on"===this.hass?.states[t]?.state}_toggleSwitch(t){this.hass?.callService?.("switch",this._switchOn(t)?"turn_off":"turn_on",{entity_id:t})}async _toggleSwitchConfirmed(t,e){const n=this._switchOn(t);await function(t){const e=document.createElement(Tt);return document.body.append(e),e.show(t)}({title:n?`Vypnout ${e}?`:`Zapnout ${e}?`,message:n?`Regulátor se odpojí a přestane nabíjet z FVE. Opravdu chceš ${e} vypnout?`:`Regulátor se připojí a začne nabíjet z FVE. Opravdu chceš ${e} zapnout?`,confirmLabel:n?"Vypnout":"Zapnout",accent:n?Ee:ke})&&this._toggleSwitch(t)}_controlChip(t,e,n,o,s,a){const r=this._switchOn(n),i=r?"#26c6da":"rgba(148,170,190,0.55)";return B`
      <g class="ctrl-chip" @click=${t=>{t.stopPropagation(),a()}}>
        <title>${o} · ${r?"zapnuto":"vypnuto"}</title>
        <rect x="${t}" y="${e}" width="${96}" height="${30}" rx="9"
          fill="rgba(255,255,255,0.05)" stroke="${i}" stroke-opacity="${r?.7:.35}"
          stroke-width="1" style="${r?`filter: drop-shadow(0 0 6px ${i}60)`:""}"/>
        ${s(t+9,e+8,14,i,r)}
        <text class="ctrl-label" x="${t+30}" y="${e+19.5}" style="fill: ${r?"#bfeef5":"rgba(226,240,248,0.6)"}">
          ${r?"Vypnout":"Zapnout"}
        </text>
      </g>`}_openDashboardEdit(){const t=new URL(window.location.href);t.searchParams.set("edit","1"),window.history.pushState(null,"",t.toString()),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0}))}_floorGridPower(t){return t.grid_power&&vt(this.hass,t.grid_power)?$t(this.hass,t.grid_power):this._phases(t).reduce((t,e)=>t+$t(this.hass,e.entity),0)}render(){const t=this._config;if(!t)return W``;if(!this.hass)return W`<ha-card></ha-card>`;const e=t.floors??[],n=this._narrow?function(t){const e=Math.max(1,t),n=20,o=480;let s=40;const a={x:n,y:s,w:o,h:190};s+=a.h+ft;const r={x:n,y:s,w:o,h:190};s+=r.h+ft;const i={x:n,y:s,w:o,h:150};s+=i.h+ft;const l={x:n,y:s,w:o,h:320};s+=l.h+ft;const c={x:n,y:s,w:o,h:260};s+=c.h+ft;const h={x:n,y:s,w:o,h:210};s+=h.h+ft;const d=s,p=[];for(let t=0;t<e;t++)p.push({x:n,y:d+196*t,w:o,h:170});const _=p[p.length-1].y+170,m=`M ${a.x+a.w/2} ${a.y+a.h} L ${r.x+r.w/2} ${r.y}`,u=`M ${a.x+a.w} ${a.y+.65*a.h} H 510 V ${i.y+.35*i.h} H ${i.x+i.w}`,y=`M ${i.x+i.w} ${i.y+.65*i.h} H 510 V ${c.y+.3*c.h} H ${c.x+c.w}`,f=`M ${l.x+l.w/2} ${l.y+l.h} L ${c.x+c.w/2} ${c.y}`,g=c.y+c.h-24,x=h.y+h.h/2,$=p.map(t=>{const e=t.y+t.h/2;return`M ${c.x} ${g} H 10 V ${e} H ${t.x}`}),v=p.map(t=>{const e=t.y+t.h/2;return`M ${h.x+h.w} ${x} H 510 V ${e} H ${t.x+t.w}`});return{width:520,height:Math.max(600,_+40),pv:a,mppt:i,battery:l,inverter:c,solcast:r,grid:h,floors:p,paths:{pvMppt:u,mpptInv:y,batInv:f,pvSolcast:m,islandTaps:$,gridTaps:v}}}(Math.max(1,e.length)):function(t){const e=Math.max(1,t),n={x:50,y:40,w:300,h:190},o={x:50,y:280,w:300,h:150},s={x:50,y:480,w:300,h:320},a=Math.round(519),r={x:a,y:360,w:280,h:260},i={x:a,y:40,w:280,h:190},l={x:yt,y:40,w:380,h:210},c=[];for(let t=0;t<e;t++)c.push({x:yt,y:280+200*t,w:380,h:170});const h=c[c.length-1].y+170,d=n.x+n.w/2,p=r.y+r.h/2,_=l.y+l.h/2,m={pvMppt:`M ${d} ${n.y+n.h} L ${d} ${o.y}`,pvSolcast:`M ${n.x+n.w} ${n.y+n.h/2} H ${i.x}`,mpptInv:`M ${o.x+o.w} ${o.y+o.h/2} H ${r.x-80} V ${r.y+50} H ${r.x}`,batInv:`M ${s.x+s.w} ${s.y+150} H ${r.x-40} V ${r.y+120} H ${r.x}`,islandTaps:c.map(t=>{const e=t.y+t.h/2;return`M ${r.x+r.w} ${p} H 928 V ${e} H ${t.x}`}),gridTaps:c.map(t=>{const e=t.y+t.h/2;return`M ${l.x+l.w} ${_} H 1388 V ${e} H ${t.x+t.w}`})};return{width:1440,height:Math.max(820,h+40),pv:n,mppt:o,battery:s,inverter:r,solcast:i,grid:l,floors:c,paths:m}}(Math.max(1,e.length)),o=this._flowBase(),s=$t(this.hass,t.pv?.power),a=$t(this.hass,t.battery?.power),r=t.battery?.invert?-a:a,i=r>=o.deadband,l=r<=-o.deadband,c=vt(this.hass,t.inverter?.load_power)?$t(this.hass,t.inverter?.load_power):$t(this.hass,t.inverter?.power),h=vt(this.hass,t.grid?.power)?$t(this.hass,t.grid?.power):e.reduce((t,e)=>t+this._floorGridPower(e),0),d=(t,e,n)=>zt(t,e,{...o,reverse:!1,hidden:!1,...n});return W`
      <ha-card>
        <svg
          viewBox="0 0 ${n.width} ${n.height}"
          preserveAspectRatio="xMidYMid meet"
          role="img"
        >
          ${t.title?B`<text class="card-title" x="${n.width/2}" y="26" text-anchor="middle">${t.title}</text>`:q}
          <g class="settings-btn" @click=${t=>{t.stopPropagation(),this._openDashboardEdit()}}>
            <title>Upravit dashboard</title>
            <circle cx="${n.width-28}" cy="20" r="15" fill="rgba(255,255,255,0.05)"
              stroke="rgba(148,170,190,0.4)" stroke-width="1"/>
            ${function(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/24})" fill="${o}">
      <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
    </g>`}(n.width-28-8,12,16,"rgba(226,240,248,0.55)")}
          </g>

          <!-- Toky (pod uzly) -->
          ${t.solcast?.power_now||t.solcast?.remaining_today||t.solcast?.total_today||t.solcast?.total_tomorrow?B`<path d="${n.paths.pvSolcast}" fill="none" stroke="#ffd54f"
                stroke-opacity="0.3" stroke-width="2" stroke-dasharray="4 8" stroke-linecap="round"/>`:q}
          ${d("pv-mppt",n.paths.pvMppt,{power:s,color:xe,hidden:!t.pv?.power})}
          ${d("mppt-inv",n.paths.mpptInv,{power:s,color:xe,hidden:!t.pv?.power})}
          ${d("bat-inv",n.paths.batInv,{power:r,color:i?be:we,reverse:i,hidden:!t.battery?.power})}
          ${n.paths.islandTaps.map((t,n)=>{const o=e[n],s=o?.island_power&&vt(this.hass,o.island_power)?$t(this.hass,o.island_power):c;return d(`island-${n}`,t,{power:s,color:$e})})}
          ${n.paths.gridTaps.map((t,n)=>{const o=e[n];return d(`grid-${n}`,t,{power:o?this._floorGridPower(o):0,color:ve})})}

          <!-- Uzly -->
          ${this._nodePv(n.pv)}
          ${this._nodeMppt(n.mppt)}
          ${this._nodeBattery(n.battery,r,i,l)}
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
        style="${n?`filter: drop-shadow(0 0 10px ${e}40)`:""}"/>`}_bar(t,e,n,o){const s=t.w-40,a=Math.max(0,Math.min(1,Math.abs(e)/Math.max(1,n))),r=t.y+t.h-12;return B`
      <rect x="${t.x+20}" y="${r}" width="${s}" height="4" rx="2"
        fill="rgba(255,255,255,0.08)"/>
      ${a>0?B`<rect x="${t.x+20}" y="${r}" width="${Math.max(4,s*a)}" height="4" rx="2"
            fill="${o}" style="filter: drop-shadow(0 0 4px ${o})"/>`:q}`}_hit(t,e){return e?B`
      <rect class="hit" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" rx="18"
        fill="transparent" @click=${e}>
        <title>Zobrazit graf za 48 hodin</title>
      </rect>`:q}_nodePv(t){const e=this._config?.pv??{},n=$t(this.hass,e.power),o=Math.abs(n)>=this._flowBase().deadband,s=xt(n,e),a=s??xe;return B`
      ${this._panel(t,a,o)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${e.name||"FVE panely"}</text>
      ${this._sparklineNode(e.power,t,a)}
      ${function(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <path d="M14 8 L58 8 L50 44 L6 44 Z"/>
      <line x1="28" y1="8" x2="21" y2="44"/>
      <line x1="43" y1="8" x2="36" y2="44"/>
      <line x1="11" y1="26" x2="54" y2="26"/>
      <line x1="28" y1="44" x2="28" y2="56"/>
      <line x1="18" y1="56" x2="38" y2="56"/>
    </g>`}(t.x+18,t.y+46,60,o?a:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${a}">${e.power?Et(n):"—"}</text>
      ${s?this._bar(t,n,e.bar_max??this._flowBase().maxPower,s):q}
      <text class="small" x="${t.x+90}" y="${t.y+112}">
        Dnes <tspan class="strong">${e.energy_today?Ct($t(this.hass,e.energy_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+134}">
        Špička dnes <tspan class="strong">${e.max_power_today?Et($t(this.hass,e.max_power_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+156}">
        Celkem <tspan class="strong">${e.energy_total?Ct($t(this.hass,e.energy_total)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power?()=>this._openEntity(e.power,e.name||"FVE panely",a):void 0)}
    `}_nodeMppt(t){const e=this._config?.pv??{},n=At(this.hass,e.mppt_state),o=e.mppt_state?this.hass?.states[e.mppt_state]?.state.trim().toLowerCase():void 0,s=!!o&&!["off","vypnuto","unknown","unavailable"].includes(o);return B`
      ${this._panel(t,xe,s)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${e.mppt_name||"MPPT regulátor"}</text>
      ${function(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <rect x="8" y="12" width="48" height="40" rx="6"/>
      <path d="M16 40 L26 40 L32 24 L38 40 L48 40"/>
      <line x1="24" y1="52" x2="24" y2="58"/>
      <line x1="40" y1="52" x2="40" y2="58"/>
    </g>`}(t.x+18,t.y+44,48,s?xe:"rgba(148,170,190,0.5)")}
      <text class="medium" x="${t.x+80}" y="${t.y+66}">${n}</text>
      <text class="small" x="${t.x+80}" y="${t.y+92}">
        Napětí <tspan class="strong">${e.voltage?At(this.hass,e.voltage):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+80}" y="${t.y+114}">
        Proud <tspan class="strong">${e.current?At(this.hass,e.current):"—"}</tspan>
      </text>
      ${this._hit(t,e.mppt_state||e.voltage?()=>St(this,e.mppt_state??e.voltage):void 0)}
      ${e.mppt_switch?this._controlChip(t.x+t.w-110,t.y+12,e.mppt_switch,e.mppt_name||"MPPT regulátor",jt,()=>{this._toggleSwitchConfirmed(e.mppt_switch,e.mppt_name||"MPPT regulátor")}):q}
    `}_nodeBattery(t,e,n,o){const s=this._config?.battery??{},a=$t(this.hass,s.soc,0),r=xt(a,{yellow_from:s.yellow_from??15,green_from:s.green_from??40,severity_invert:s.severity_invert}),i=n?`▲ nabíjení ${Et(Math.abs(e))}`:o?`▼ vybíjení ${Et(Math.abs(e))}`:"● klidový stav",l=n?be:o?we:"rgba(220,235,245,0.55)";return B`
      ${this._panel(t,r,!0)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${s.name||"Baterie Pylontech"}</text>
      ${this._sparklineNode(s.soc,t,r)}
      ${function(t,e,n,o,s,a){const r=.4*n,i=o-12,l=Math.max(0,Math.min(1,s/100))*i;return B`
    <g style="filter: drop-shadow(0 0 6px ${a})">
      <rect x="${t+(n-r)/2}" y="${e-10}" width="${r}" height="${14}" rx="3"
        fill="none" stroke="${a}" stroke-width="3"/>
      <rect x="${t}" y="${e}" width="${n}" height="${o}" rx="10"
        fill="rgba(0,0,0,0.35)" stroke="${a}" stroke-width="3"/>
      <rect x="${t+6}" y="${e+6+(i-l)}" width="${n-12}" height="${l}" rx="5"
        fill="${a}" opacity="0.85"/>
    </g>`}(t.x+30,t.y+62,58,168,a,r)}
      <text class="tiny" x="${t.x+59}" y="${t.y+252}" text-anchor="middle">
        ${s.capacity?At(this.hass,s.capacity):""}
      </text>
      <text class="big" x="${t.x+118}" y="${t.y+90}" style="fill: ${r}">${s.soc?`${Math.round(a)} %`:"—"}</text>
      <text class="medium" x="${t.x+118}" y="${t.y+122}" style="fill: ${l}">${s.power?i:""}</text>
      <text class="small" x="${t.x+118}" y="${t.y+152}">
        Napětí <tspan class="strong">${s.voltage?At(this.hass,s.voltage):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+174}">
        Proud <tspan class="strong">${s.current?At(this.hass,s.current):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+196}">
        Teplota <tspan class="strong">${s.temperature?At(this.hass,s.temperature):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+118}" y="${t.y+218}">
        ${s.soh?`SoH ${At(this.hass,s.soh)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+242}">
        ${s.runtime?`Výdrž ${At(this.hass,s.runtime)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+262}">
        ${s.cycles?`Počet cyklů ${At(this.hass,s.cycles)}`:""}
      </text>
      <text class="tiny" x="${t.x+118}" y="${t.y+282}">
        ${n&&s.time_to_full?`Do nabití ${At(this.hass,s.time_to_full)}`:""}
      </text>
      ${this._hit(t,s.soc?()=>this._openEntity(s.soc,`${s.name||"Baterie Pylontech"} · SoC`,r):void 0)}
    `}_nodeInverter(t,e){const n=this._config?.inverter??{},o=vt(this.hass,n.power)?$t(this.hass,n.power):e,s=At(this.hass,n.state),a=Math.abs(o)>=this._flowBase().deadband||"—"!==s,r=xt(o,n),i=r??$e;return B`
      ${this._panel(t,i,a)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${n.name||"Měnič MultiPlus-II"}</text>
      ${this._sparklineNode(n.power,t,i)}
      ${function(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <rect x="6" y="6" width="52" height="52" rx="10"/>
      <path d="M20 26 A 14 14 0 0 1 44 26" />
      <path d="M44 26 l 1 -8 m -1 8 l -8 -1"/>
      <path d="M44 38 A 14 14 0 0 1 20 38" />
      <path d="M20 38 l -1 8 m 1 -8 l 8 1"/>
    </g>`}(t.x+18,t.y+46,56,a?i:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${i}">${Et(o)}</text>
      <circle cx="${t.x+96}" cy="${t.y+106}" r="4" fill="${"—"!==s?ke:"rgba(148,170,190,0.4)"}"/>
      <text class="small" x="${t.x+108}" y="${t.y+111}">${s}</text>
      ${n.voltage?B`<text class="small" x="${t.x+90}" y="${t.y+138}">
            Napětí <tspan class="strong">${At(this.hass,n.voltage)}</tspan>
          </text>`:q}
      ${n.current?B`<text class="small" x="${t.x+90}" y="${t.y+160}">
            Proud <tspan class="strong">${At(this.hass,n.current)}</tspan>
          </text>`:q}
      ${n.load_power?B`<text class="tiny" x="${t.x+90}" y="${t.y+184}">
            Kritické zátěže ${Et($t(this.hass,n.load_power))}
          </text>`:q}
      ${r?this._bar(t,o,n.bar_max??this._flowBase().maxPower,r):q}
      ${n.days_in_service?B`<text class="tiny" x="${t.x+20}" y="${t.y+t.h-20}">
            Počet dní v provozu <tspan class="strong">${At(this.hass,n.days_in_service)}</tspan>
          </text>`:q}
      ${this._hit(t,n.power||n.load_power?()=>this._openEntity(n.power??n.load_power,n.name||"Měnič MultiPlus-II",i):void 0)}
      ${n.fan_switch?this._controlChip(t.x+t.w-110,t.y+t.h-52,n.fan_switch,"Chlazení",Ft,()=>this._toggleSwitch(n.fan_switch)):q}
    `}_nodeSolcast(t){const e=this._config?.solcast;if(!e||!e.power_now&&!e.remaining_today&&!e.total_today&&!e.total_tomorrow)return q;const n=$t(this.hass,e.power_now),o=xt(n,e),s=o??"#ffd54f",a=Math.abs(n)>=this._flowBase().deadband;return B`
      ${this._panel(t,s,a)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">Předpověď Solcast</text>
      ${Pt(t.x+16,t.y+58,56,a?s:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${s}">
        ${e.power_now?Et(n):"—"}
      </text>
      ${o?this._bar(t,n,e.bar_max??this._flowBase().maxPower,o):q}
      <text class="small" x="${t.x+90}" y="${t.y+112}">
        Zbývá dnes <tspan class="strong">${e.remaining_today?Ct($t(this.hass,e.remaining_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+134}">
        Dnes celkem <tspan class="strong">${e.total_today?Ct($t(this.hass,e.total_today)):"—"}</tspan>
      </text>
      <text class="small" x="${t.x+90}" y="${t.y+156}">
        Zítra celkem <tspan class="strong">${e.total_tomorrow?Ct($t(this.hass,e.total_tomorrow)):"—"}</tspan>
      </text>
      ${this._hit(t,e.power_now?()=>this._openSolcastHistory(e):void 0)}
    `}_nodeGrid(t,e){const n=this._config?.grid??{},o=Math.abs(e)>=this._flowBase().deadband,s=this._gridPhases(n),a=xt(e,n),r=a??ve;return B`
      ${this._panel(t,r,o)}
      <text class="node-title" x="${t.x+20}" y="${t.y+28}">${n.name||"Síť ČEZ"}</text>
      ${this._sparklineNode(n.power,t,r)}
      ${function(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${o}" fill="none"
       stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
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
    </g>`}(t.x+16,t.y+44,52,o?r:"rgba(148,170,190,0.5)")}
      <text class="big" x="${t.x+90}" y="${t.y+84}" style="fill: ${r}">${Et(e)}</text>
      ${a?this._bar(t,e,n.bar_max??this._flowBase().maxPower,a):q}
      <text class="tiny" x="${t.x+90}" y="${t.y+108}">
        ${n.energy_total?`Celkem ze sítě ${Ct($t(this.hass,n.energy_total))}`:""}
        ${n.energy_today?` · dnes ${Ct($t(this.hass,n.energy_today))}`:""}
      </text>
      ${this._hit(t,n.power?()=>this._openEntity(n.power,n.name||"Síť",r):void 0)}
      ${s.length?Ht(t,s,this.hass,t=>{const e=s.find(e=>e.entity===t);this._openEntity(t,this._entityName(t),e?Ce[e.label]?.color??ve:ve)},{itemStyle:t=>({iconColor:Ce[t.label]?.color??ve,borderColor:Ce[t.label]?.border})}):q}
    `}_nodeFloor(t,e){const n=this._floorGridPower(e),o=!!e.island_power&&vt(this.hass,e.island_power),s=o?$t(this.hass,e.island_power):0,a=this._phases(e),r=Math.abs(n)>=this._flowBase().deadband||o&&Math.abs(s)>=this._flowBase().deadband,i=o&&s>n?$e:ve,l=o?[{entity:e.island_power,name:"FVE výroba",icon:"mdi:solar-power",label:"FVE"}]:[],c=a,h=(t,n)=>{const o=[...l,...c].find(e=>e.entity===t);this._openEntity(t,o?`${e.name||"Patro"} · ${o.name}`:this._entityName(t),n?$e:o?Ce[o.label]?.color??ve:ve)},d={icon:Pt,iconColor:$e,borderColor:"rgba(0,230,118,0.22)"},p=l.length>0&&c.length>0,_=t.w-28-(p?24:0),m=l.length+c.length,u=p?_*l.length/m:_,y={x:t.x+14,w:u},f=p?{x:t.x+14+u+24,w:_-u}:{x:t.x+14,w:_},g=t.y+t.h-72-24,x=t.x+14+u+12;return B`
      ${this._panel(t,i,r)}
      ${function(t,e,n,o){return B`
    <g transform="translate(${t},${e}) scale(${n/64})" stroke="${o}" fill="none"
       stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
       style="filter: drop-shadow(0 0 5px ${o})">
      <path d="M8 32 L32 10 L56 32"/>
      <path d="M14 28 L14 56 L50 56 L50 28"/>
      <path d="M26 56 L26 40 L38 40 L38 56"/>
    </g>`}(t.x+16,t.y+12,30,i)}
      <text class="floor-name" x="${t.x+54}" y="${t.y+34}">${e.name??"Patro"}</text>
      <text class="floor-val" x="${t.x+t.w-20}" y="${t.y+32}" text-anchor="end">
        <tspan class="dim">síť </tspan><tspan class="val-grid strong">${Et(n)}</tspan>
      </text>
      <text class="tiny" x="${t.x+54}" y="${t.y+56}">
        ${e.grid_energy?`Celkem ze sítě ${Ct($t(this.hass,e.grid_energy))}`:""}
        ${e.island_energy?` · z fve ${Ct($t(this.hass,e.island_energy))}`:""}
      </text>
      ${this._hit({x:t.x,y:t.y,w:t.w,h:64},e.grid_power||e.island_power||a.length?()=>this._openFloorHistory(e,a):void 0)}
      ${p?B`<line x1="${x}" y1="${g-4}" x2="${x}" y2="${g+76}"
            stroke="rgba(148,170,190,0.18)" stroke-width="1"/>`:q}
      ${l.length?Ht(t,l,this.hass,t=>h(t,!0),{itemStyle:()=>d,zone:y}):q}
      ${c.length?Ht(t,c,this.hass,t=>h(t,!1),{itemStyle:t=>({iconColor:Ce[t.label]?.color??ve,borderColor:Ce[t.label]?.border}),zone:f}):q}
    `}};Ae.NARROW_BREAKPOINT=640,Ae.styles=r`
    :host {
      display: block;
      height: 100%;
    }
    /* Úzká karta (mobil): scéna je vertikální a delší než okno, takže se
       nechá stránku rolovat místo vnucování max-height clampu.
       !important — HA grid/masonry wrapper okolo karty někdy vnucuje
       vlastní výšku podle počtu řádků, tady musí vyhrát obsah. */
    :host([narrow]) {
      height: auto !important;
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
    :host([narrow]) ha-card {
      height: auto !important;
      overflow: visible;
      align-items: flex-start;
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
    :host([narrow]) svg {
      max-height: none;
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
    .settings-btn {
      cursor: pointer;
    }
    .settings-btn circle {
      transition: fill 0.15s ease, stroke 0.15s ease;
    }
    .settings-btn:hover circle {
      fill: rgba(255, 255, 255, 0.1);
      stroke: rgba(79, 195, 247, 0.55);
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
  `,t([mt({attribute:!1})],Ae.prototype,"hass",void 0),t([ut()],Ae.prototype,"_config",void 0),t([ut()],Ae.prototype,"_spark",void 0),t([ut()],Ae.prototype,"_narrow",void 0),Ae=ge=t([dt("fve-flow-card")],Ae),window.customCards=window.customCards||[],window.customCards.push({type:"fve-flow-card",name:"FVE Flow Card",description:"Animovaný diagram toků energie pro ostrovní FVE (Victron) + grid po patrech (Shelly), se Solcast predikcí.",preview:!1,documentationURL:"https://github.com/elvisek/fve-flow-card"});export{Ae as FveFlowCard};

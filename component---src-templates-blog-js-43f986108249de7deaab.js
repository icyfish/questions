(self.webpackChunkblog=self.webpackChunkblog||[]).push([[744],{3483:function(e){"use strict";e.exports=JSON.parse('{"layout":"fixed","backgroundColor":"#f8f8f8","images":{"fallback":{"src":"/blog/static/0d1ae485b869926285547d68f24089ad/d24ee/photo.jpg","srcSet":"/blog/static/0d1ae485b869926285547d68f24089ad/d24ee/photo.jpg 50w,\\n/blog/static/0d1ae485b869926285547d68f24089ad/64618/photo.jpg 100w","sizes":"50px"},"sources":[{"srcSet":"/blog/static/0d1ae485b869926285547d68f24089ad/d4bf4/photo.avif 50w,\\n/blog/static/0d1ae485b869926285547d68f24089ad/ee81f/photo.avif 100w","type":"image/avif","sizes":"50px"},{"srcSet":"/blog/static/0d1ae485b869926285547d68f24089ad/3faea/photo.webp 50w,\\n/blog/static/0d1ae485b869926285547d68f24089ad/6a679/photo.webp 100w","type":"image/webp","sizes":"50px"}]},"width":50,"height":50}')},4826:function(e,t,a){"use strict";var n=a(7294),r=a(5444),l=a(3217);t.Z=function(){var e,t,i=(0,r.useStaticQuery)("3257411868");null===(e=i.site.siteMetadata)||void 0===e||e.author,null===(t=i.site.siteMetadata)||void 0===t||t.social;return n.createElement("div",{className:"bio"},n.createElement(l.S,{className:"bio-avatar",layout:"fixed",formats:["AUTO","WEBP","AVIF"],src:"../../static/images/photo.jpg",width:50,height:50,quality:95,alt:"Profile picture",__imageData:a(3483)}))}},1490:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return d}});var n=a(7294),r=a(5444),l=a(4826),i=a(6922),o=a(2502);var c=function(e){var t=e.headings,a=t.map((function(e){return Object.assign({},e,{id:"#"+e.value.replace(/\s+/g,"-").toLowerCase()})})),r=function(e){var t=(0,n.useState)(""),a=t[0],r=t[1];return(0,n.useEffect)((function(){var t=new IntersectionObserver((function(e){e.forEach((function(e){e.isIntersecting&&r(e.target.id)}))}),{rootMargin:"0% 0% -80% 0%"});return e.forEach((function(e){var a=document.querySelector(e.id);a&&t.observe(a)})),function(){e.forEach((function(e){var a=document.querySelector(e.id);a&&t.unobserve(a)}))}}),[e]),a}(a);return 0===t.length?null:n.createElement("ul",{className:"table_list"},n.createElement("h3",{className:"title"},"Table of contents"),n.createElement("div",{className:"headings"},a.map((function(e){var t="#"+r===e.id?"active":"";return e.depth>4?n.createElement("div",null):n.createElement("li",{key:e.id,style:{marginLeft:10*e.depth+"px"}},n.createElement("a",{href:e.id,className:t},e.value))}))))};function s(e){var t=e.post;return n.createElement("article",{className:"blog-post",itemScope:!0,itemType:"http://schema.org/Article"},n.createElement("header",null,n.createElement("h1",{itemProp:"headline"},t.frontmatter.title),n.createElement("p",null,t.frontmatter.date)),n.createElement("section",{dangerouslySetInnerHTML:{__html:t.html},itemProp:"articleBody"}),n.createElement("hr",null),n.createElement("footer",null,n.createElement(l.Z,null)))}var d=function(e){var t,a=e.data,l=e.location,d=a.markdownRemark,u=(null===(t=a.site.siteMetadata)||void 0===t?void 0:t.title)||"Title",f=a.previous,m=a.next;return n.createElement(i.Z,{location:l,title:u},n.createElement(o.Z,{title:d.frontmatter.title,description:d.frontmatter.description||d.excerpt}),n.createElement(c,{headings:d.headings}),n.createElement(s,{post:d,location:l}),n.createElement("nav",{className:"blog-post-nav"},n.createElement("ul",{style:{display:"flex",flexWrap:"wrap",justifyContent:"space-between",listStyle:"none",padding:0}},n.createElement("li",null,f&&n.createElement(r.Link,{to:f.fields.slug,rel:"prev"},"← ",f.frontmatter.title)),n.createElement("li",null,m&&n.createElement(r.Link,{to:m.fields.slug,rel:"next"},m.frontmatter.title," →")))))}}}]);
//# sourceMappingURL=component---src-templates-blog-js-43f986108249de7deaab.js.map
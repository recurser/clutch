/*
 * Allows us to pass DOM elements to prototype's Insertion class 
 * rather than strings.
 *
 * Courtesy of agileweb
 * http://www.agileweb.org/2006/10/22/prototype-insertion-scriptaculous-builder
 */

Object.extend(Abstract.Insertion.prototype, {
  initialize: function(element, content) {
    this.element = $(element);
    if (typeof content == 'object') {
      content = this.contentFromObject(content);
    }
    this.content = content.stripScripts();
    if (this.adjacency && this.element.insertAdjacentHTML) {
      try {
        this.element.insertAdjacentHTML(this.adjacency, this.content);
      } catch (e) {
        var tagName = this.element.tagName.toLowerCase();
        if (tagName == 'tbody' || tagName == 'tr') {
          this.insertContent(this.contentFromAnonymousTable());
        } else {
          throw e;
        }
      }
    } else {
      this.range = this.element.ownerDocument.createRange();
      if (this.initializeRange) this.initializeRange();
      this.insertContent([this.range.createContextualFragment(this.content)]);
    }
    setTimeout(function() {content.evalScripts()}, 10);
  },
  contentFromObject: function (content) {
    try {
      var div = document.createElement('div');
      div.appendChild(content);
      content = div.innerHTML;
    } catch (e) {
        content = '';
    }
    return content;
  }
});
// Reset the Insertion Prototypes to inherit from the new Abstract Insertion class
Insertion.Before.prototype = Object.extend(new Abstract.Insertion('beforeBegin'),Insertion.Before.prototype);
Insertion.Top.prototype = Object.extend(new Abstract.Insertion('afterBegin'), Insertion.Top.prototype);
Insertion.Bottom.prototype = Object.extend(new Abstract.Insertion('beforeEnd'), Insertion.Bottom.prototype);
Insertion.After.prototype = Object.extend(new Abstract.Insertion('afterEnd'), Insertion.After.prototype);
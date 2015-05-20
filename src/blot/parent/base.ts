import Blot from '../base';
import LeafBlot from '../leaf/base';
import LinkedList from '../../collection/linked-list';
import { ShadowParent } from '../shadow';
import * as Registry from '../../registry';


class ParentBlot extends Blot implements ShadowParent {
  static nodeName = 'parent';
  static scope = Registry.Scope.BLOCK;

  parent: ParentBlot = null;
  children: LinkedList<Blot> = new LinkedList<Blot>();

  constructor(value: HTMLElement) {
    super(value);
    this.build();
  }

  build(): void {
    var childNodes = Array.prototype.slice.call(this.domNode.childNodes || []);
    childNodes.forEach((node) => {
      var BlotClass = Registry.match(node);
      if (BlotClass != null) {
        var child = new BlotClass(node);
        this.appendChild(child);
      } else if (node.parentNode != null) {
        node.parentNode.removeChild(node);
      }
    });
  }

  formats(): any {
    throw new Error('ParentNode.formats() should be overwritten.');
  }

  length(): number {
    return this.children.reduce(function(memo, child) {
      return memo + child.length();
    }, 0);
  }

  values(): any[] {
    return this.children.reduce(function(memo, child) {
      var value = child.values();
      if (value instanceof Array) {
        memo = memo.concat(value);
      } else if (value != null) {
        memo.push(value);
      }
      return memo;
    }, []);
  }

  deleteAt(index: number, length: number): void {
    if (index === 0 && length === this.length()) {
      this.remove();
    } else {
      this.children.forEachAt(index, length, function(child, offset, length) {
        child.deleteAt(offset, length);
      });
    }
  }

  format(name: string, value: any): void {
    if (this.statics.nodeName === name) {
      if (value) return; // Nothing to do if adding existing format
      this.unwrap();
    } else {
      if (!value) return; // Can't remove formatting from self
      this.wrap(name, value);
    }
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    if (index === 0 && length === this.length()) {
      this.format(name, value);
    } else {
      this.children.forEachAt(index, length, function(child, offset, length) {
        child.formatAt(offset, length, name, value);
      });
    }
  }

  insertAt(index: number, value: string, def?: any): void {
    var _arr = this.children.find(index);
    var child = _arr[0], offset = _arr[1];
    child.insertAt(offset, value, def);
  }

  appendChild(other: Blot): void {
    this.insertBefore(other);
  }

  insertBefore(childNode: Blot, refNode?: Blot): void {
    this.children.insertBefore(childNode, refNode);
    var refDomNode = null;
    if (refNode != null) {
      refDomNode = refNode.domNode;
    }
    if (childNode.next == null || childNode.domNode.nextSibling != refDomNode) {
      this.domNode.insertBefore(childNode.domNode, refDomNode);
    }
    childNode.parent = this;
  }


  // isolate(index: number, length: number): ShadowParent {
  //   return <ShadowParent>super.isolate(index, length);
  // }

  moveChildren(parent: ParentBlot, refNode?: Blot): void {
    this.children.forEach(function(child) {
      parent.insertBefore(child, refNode);
    });
  }

  replace(name: string, value: any): Blot {
    var replacement = <ParentBlot>super.replace(name, value);
    this.moveChildren(replacement);
    return replacement;
  }

  split(index: number): Blot {
    if (index === 0) return this;
    if (index === this.length()) return this.next;
    var after = <ParentBlot>this.clone();
    this.parent.insertBefore(after, this.next);
    this.children.forEachAt(index, this.length(), function(child, offset, length) {
      var child = <Blot>child.split(offset);
      child.remove();
      after.appendChild(child);
    });
    return after;
  }

  unwrap(): void {
    this.moveChildren(this.parent, this);
    this.remove();
  }
}


export default ParentBlot;
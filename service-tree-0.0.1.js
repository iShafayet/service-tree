/* service tree is a service manager and service abstraction layer */
(function () {
  class StandardEvent {

    /**
     * Creates an instance of StandardEvent.
     * @param {any} [{
        bubbles = true,
        propagates = true,
        detail = {},
        target = null,
        path = [],
        name = ''
      }] 
     * @memberof StandardEvent
     */
    constructor(options = {}) {
      let {
      bubbles = true,
        propagates = true,
        detail = {},
        target = null,
        path = [],
        name = ''
    } = options;
      Object.assign(this, { bubbles, propagates, detail, target, path, name });
    }
  }

  class EventEmitter {

    constructor() {
      this.eventListenerListMap = {};
    }

    addEventListener(event, fn) {
      if (!(event in this.eventListenerListMap)) {
        this.eventListenerListMap[event] = [];
      }
      this.eventListenerListMap[event].push(fn);
      return this;
    }

    on(event, fn) {
      return this.addEventListener(event, fn);
    }

    removeEventListener(event = null, fn = null) {
      if (event === null) {
        this.eventListenerListMap = {};
      } else if (fn === null && (event in this.eventListenerListMap)) {
        this.eventListenerListMap[event] = [];
      } else if (event in this.eventListenerListMap) {
        let index = this.eventListenerListMap[event].indexOf(fn);
        this.eventListenerListMap[event].splice(index, 1);
      }
      return this;
    }

    /**
     * Emits and remits and event
     * @param {String} event 
     * @param {StandardEvent}
     */
    emit(event, object = new StandardEvent()) {
      object.alias = event;
      object.target = this;
      if (event in this.eventListenerListMap) {
        for (let fn of this.eventListenerListMap[event]) {
          if (!object.propagates) break;
          fn(object);
        }
      }
      return object;
    }

  }

  class Service extends EventEmitter {

    constructor() {
      super();
      this.manager = null;
    }

    setManager(manager) {
      this.manager = manager;
    }

    _serviceStart() {
      this.emit('service-start', new StandardEvent({
        name: 'service-start'
      }));
    }

    _serviceEnd() {
      this.emit('service-end', new StandardEvent({
        name: 'service-end'
      }));
    }

    emit(event, object) {
      object = super.emit(event, object);
      object.path.push(this);
      if (this.manager && object.bubbles) {
        this.manager.emit(event, object);
      }
    }

  }

  class ServiceManager extends EventEmitter {

    constructor(parentService = null) {
      super();
      this.managedServiceList = []
      this.parentService = null
      this.activeServiceList = [];
    }

    manage(service) {
      this.managedServiceList.push(service);
      service.setManager(this);
      service.on('service-start', (event) => {
        this.activeServiceList.push(service);
        this.emit('service-change', new StandardEvent({
          name: 'service-change',
          detail: {
            activeCount: this.activeServiceList.length
          }
        }));
      });
      service.on('service-end', (event) => {
        let index = this.activeServiceList.indexOf(service);
        this.activeServiceList.splice(index, 1);
        this.emit('service-change', new StandardEvent({
          name: 'service-change',
          detail: {
            activeCount: this.activeServiceList.length
          }
        }));
      });
    }

    emit(event, object) {
      object = super.emit(event, object);
      object.path.push(this);
      if (this.parentService && object.bubbles) {
        this.parentService.emit(event, object);
      }
    }

  }

  window.ServiceTree = {
    StandardEvent,
    EventEmitter,
    ServiceManager,
    Service
  }

})();
import $ from 'jquery';

const dragOver = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "none";
    if (ev.target.attributes.length > 0) {
      if (ev.target.attributes[0].value === 'groupped-tabs') {
        ev.dataTransfer.dropEffect = "copy";
      }
    }
};

const drag = (ev) => {
  ev.dataTransfer.setData("item-id", ev.target.id);
  ev.dataTransfer.setData("item-url", ev.target.attributes[4].value);
  ev.dataTransfer.setData("item-title", ev.target.children[1].innerText);
};

const drop = (ev) => {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("item-id");
  const url = ev.dataTransfer.getData("item-url");
  const title = ev.dataTransfer.getData("item-title");
  const group = ev.path[0].id;
  chrome.storage.sync.get((ob) => {
    let tabs4later = ob.tabs4later;
    let allTabs = ob.tabs4later;
    let groupUrlObjs = ob.tabs4later[group];
    let groupUrls = [];
    groupUrlObjs.forEach(key => {
      groupUrls = groupUrls.concat(Object.keys(key)[0]);
    });
    let newUrl = {};
    if (!groupUrls.includes(url)) {
      newUrl[url] = {
        id: id,
        url: url,
        title: title,
        idle: 0
      };
      groupUrlObjs = groupUrlObjs.concat(newUrl);
      tabs4later[group] = groupUrlObjs;
    }
    moveTabToSavedGroup(ev, id, url, tabs4later, group);
  });
};

const moveTabToSavedGroup = (ev, id, url, tabs4later, group) => {
  if (ev.target.id === group) {
    const children = Array.prototype.slice.call(ev.target.children);
    let included = false;
    children.forEach(child => {
      if (child.attributes[2].value === url){
        included = true;
      }
    });
    if (!included) {
      ev.target.appendChild(document.getElementById(id));
      $(`#${id}`).removeClass('single-open-tab');
      $(`#${id}`).addClass('single-groupped-tab');
    }
    chrome.tabs.remove(parseInt(id));
    chrome.storage.sync.set(
      {
        tabs4later
      });
    }
};

$( document ).ready( () => {
    const loadAndUpdate = () => {
      loadOpenTabs();
      loadSavedTabs();
      updateOpenTabs();
    };
    const addEventHandlers = () => {
      $("html").on("dragover", function(event) {
          event.preventDefault();
          event.stopPropagation();
      });
      $("html").on("dragleave", function(event) {
          event.preventDefault();
          event.stopPropagation();
      });
      $('.groupped-tabs').on('drop', () => {
        drop(event);
      });
      $('html').on('dragover', () => {
        dragOver(event);
      });
      $('.create-new-group').on("click", createNewGroup);
    };
    const initializePage = () => {
      loadAndUpdate();
      addEventHandlers();
    };
    chrome.storage.sync.get(ob => {
      if (ob['tabs4later']) {
        initializePage();
      } else {
        chrome.storage.sync.set(
          {
            tabs4later: {
              group1: []
            }
          },
          initializePage()
        );
      }
    });
});

const loadOpenTabs = () => {
  chrome.tabs.query({}, (tabs) => {
    $('.open-tabs').empty();
    $('.open-tabs').off();
    const openTabs = tabs;
    openTabs.forEach( tab => {
      if (tab.url === "chrome://newtab/") {
        return;
      }
      $('.open-tabs').append(`<li class=single-open-tab grabbable id=${tab.id} draggable=true data-url=${tab.url} data-title=${tab.title}><button class=hidden-remove-open >x</button><div>${tab.title}</div></li>`);
      $(`#${tab.id}`).addClass('grabbable');
    });
    $('.single-open-tab').on('dragstart', () => {
      $('single-groupped-tab').addClass('no-drop-zone');
      drag(event);
    });
    $('.hidden-remove-open').click((e) => {
      e.stopPropagation();
      const id = e.target.parentNode.attributes[2].value;
      chrome.tabs.remove(parseInt(id));
    });
  });
};

const loadSavedTabs = () => {
  chrome.storage.sync.get(ob => {
    let allSavedTabs = ob;
    $( ".single-groupped-tab" ).off();

    if (allSavedTabs['tabs4later'] && allSavedTabs['tabs4later']['group1']) {
      allSavedTabs = allSavedTabs.tabs4later;
      let groups = Object.keys(allSavedTabs);
      groups = groups.sort((a,b) => {
        return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
      });
      groups.forEach((group, idx) => {
        $(`#${group}`).empty();
        const groupInserted = $(`#${group}`);
        if (groupInserted.length > 0) {
          return;
        }
        const capitalizeFirstLetter = (string) => {
          return string.charAt(0).toUpperCase() + string.slice(1);
        };
        $(`<div class=single-tab-group><div class=tab-group-container><button class=delete-tab-group>Delete Group</button><button class=hidden></button><div class=group-name>${capitalizeFirstLetter(group)}</div><button class='open-all-tabs'>Open All Tabs</button><button class=clear-group-tabs>Clear Group</button></div><ul class=groupped-tabs id=${group}></ul></div>`).insertBefore('.create-new-group');
      });
      groups.forEach(group => {
        const urls = allSavedTabs[group];
        urls.forEach(key => {
          const url = Object.keys(key)[0];
          const id = key[url].id;
          const title = key[url].title;
          $(`#${group}`).append(`<li class=single-groupped-tab data-id=${id} data-url=${url} data-title=${title}><button class=hidden-remove-saved >x</button><div >${title}</div></li>`);
        });
      });
      $('.clear-group-tabs').off();
      $('.delete-tab-group').off();
      $('.clear-group-tabs').on('click', removeAllSavedTabs);
      $('.delete-tab-group').on('click', deleteGroup);
      $( ".single-groupped-tab" ).click((e) => {
        chrome.tabs.create({url: e.currentTarget.attributes[2].value, active: true});
      });
      $('.single-groupped-tab').on('dragover', () => {
        dragOver(event);
      });
      $('.hidden-remove-saved').click((e) => {
        e.stopPropagation();
        const url = e.target.parentNode.attributes[2].value;
        const group = e.originalEvent.path[2].id;
        removeSavedTab(url, group);
      });
    }
    $('.groupped-tabs').off();
    $('.groupped-tabs').on('drop', () => {
      drop(event);
    });
    $('.open-all-tabs').off();
    $('.open-all-tabs').on('click', (e) => {
      const group = e.target.parentNode.nextElementSibling.attributes[1].value;
      const urlObjs = allSavedTabs[group];
      if (urlObjs.length === 0) {
        return;
      }
      urlObjs.forEach( urlObj => {
        const url = Object.keys(urlObj)[0];
        chrome.tabs.create({url: url, active: false});
      });
    });
  });
};

const removeSavedTab = (url, group) => {
  chrome.storage.sync.get((ob) => {
    let groupUrls = ob.tabs4later[group];
    let updatedUrls = [];
    groupUrls.forEach(urlObj => {
      if (Object.keys(urlObj)[0] === url) {
        return;
      } else {
        updatedUrls = updatedUrls.concat(urlObj);
      }
    });
    let tabs4later = ob.tabs4later;
    tabs4later[group] = updatedUrls;
    chrome.storage.sync.set(
      {
        tabs4later
      }, () => {
      loadOpenTabs();
      loadSavedTabs();
    });
  });
};

const removeAllSavedTabs = (ev) => {
  const group = ev.originalEvent.path[2].children[1].id;
  chrome.storage.sync.get(ob => {
    let tabs4later = ob.tabs4later;
    tabs4later[group] = [];
    chrome.storage.sync.set({tabs4later}, loadSavedTabs);
  });
};

const deleteGroup = (ev) => {
  const group = ev.originalEvent.path[2].children[1].id;
  chrome.storage.sync.get(ob => {
    let tabs4laterPrev = ob.tabs4later;
    let tabs4later = {};
    const groups = Object.keys(tabs4laterPrev);
    groups.forEach(key => {
      if (key !== group) {
        tabs4later[key] = tabs4laterPrev[key];
      }
    });
    chrome.storage.sync.set({tabs4later}, window.location.reload());
  });
};

const updateOpenTabs = () => {
  chrome.tabs.onUpdated.addListener((tabId , info) => {
    if (info.status === "complete") {
      loadOpenTabs();
      loadSavedTabs();
    }
  });
  chrome.tabs.onRemoved.addListener(() => {
    loadOpenTabs();
    loadSavedTabs();
  });
};

const createNewGroup = () => {
  chrome.storage.sync.get(ob => {
    let groups = Object.keys(ob.tabs4later);
    groups = groups.sort((a,b) => {
      return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
    });
    let groupString = groups[groups.length-1];
    let numGroups = parseInt(groupString.match(/\d+/)[0]) + 1;
    $(`<div class=single-tab-group><div class=tab-group-container><button class=delete-tab-group>Delete Group</button><button class=hidden></button><div class=group-name>Group${numGroups}</div><button class=open-all-tabs>Open All Tabs</button><button class=clear-group-tabs>Clear Group</button></div><ul class=groupped-tabs id=group${numGroups}></ul></div>`).insertBefore('.create-new-group');
    let tabs4later = ob.tabs4later;
    tabs4later[`group${numGroups}`] = [];
    chrome.storage.sync.set(
      {
        tabs4later
      },
      loadSavedTabs()
    );
  });
};

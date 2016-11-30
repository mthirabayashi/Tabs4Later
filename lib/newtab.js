import $ from 'jquery';

const dragOver = (ev) => {
    ev.preventDefault();
    // console.log(ev);
    ev.dataTransfer.dropEffect = "none";
    if (ev.target.attributes.length > 0) {
      if (ev.target.attributes[0].value === 'groupped-tabs') {
        ev.dataTransfer.dropEffect = "copy";
      }
    }
};

const drag = (ev) => {
  // console.log(ev.target.id);
  ev.dataTransfer.setData("item-id", ev.target.id);
  ev.dataTransfer.setData("item-url", ev.target.attributes[4].value);
  ev.dataTransfer.setData("item-title", ev.target.children[1].innerText);
};

const drop = (ev) => {
  ev.preventDefault();
  // console.log(ev);
  const id = ev.dataTransfer.getData("item-id");
  const url = ev.dataTransfer.getData("item-url");
  const title = ev.dataTransfer.getData("item-title");
  const group = ev.path[0].id;
  // console.log(group);
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
    // console.log(children);
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
      }, () => {
        // console.log('tab set');
      });
    }
};

$( document ).ready( () => {
    // console.log( "ready!" );
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
        // console.log('dropped!');
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
  // console.log('load open tabs');
  chrome.tabs.query({}, (tabs) => {
    // console.log(tabs);
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
      // console.log(e);
      // console.log(e.target.parentNode.attributes[2].value);
      const id = e.target.parentNode.attributes[2].value;
      chrome.tabs.remove(parseInt(id));
    });
  });
};

const loadSavedTabs = () => {
  // console.log('load saved tabs');
  chrome.storage.sync.get(ob => {
    let allSavedTabs = ob;
    // $('#group1').empty();
    $( ".single-groupped-tab" ).off();


    if (allSavedTabs['tabs4later'] && allSavedTabs['tabs4later']['group1']) {
      allSavedTabs = allSavedTabs.tabs4later;
      let groups = Object.keys(allSavedTabs);
      groups = groups.sort((a,b) => {
        return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
      });
      // console.log(groups);
      groups.forEach((group, idx) => {
        $(`#${group}`).empty();
        const groupInserted = $(`#${group}`);
        if (groupInserted.length > 0) {
          return;
        }
        const capitalizeFirstLetter = (string) => {
          return string.charAt(0).toUpperCase() + string.slice(1);
        };
        $(`<div class=single-tab-group><div class=tab-group-container><button class=delete-tab-group>Delete Group</button><div class=group-name>${capitalizeFirstLetter(group)}</div><button class=clear-group-tabs>Clear Group</button></div><ul class=groupped-tabs id=${group}></ul></div>`).insertBefore('.create-new-group');
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
      // console.log('dropped!');
      drop(event);
    });
  });
};

const removeSavedTab = (url, group) => {
  // console.log(url);
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
      // console.log('saved tabs updated');
    });
  });
};

const removeAllSavedTabs = (ev) => {
  // console.log(ev);
  const group = ev.originalEvent.path[2].children[1].id;
  // console.log(group);
  chrome.storage.sync.get(ob => {
    let tabs4later = ob.tabs4later;
    tabs4later[group] = [];
    chrome.storage.sync.set({tabs4later}, loadSavedTabs);
  });
};

const deleteGroup = (ev) => {
  // console.log(ev);
  const group = ev.originalEvent.path[2].children[1].id;
  // console.log(group);
  chrome.storage.sync.get(ob => {
    let tabs4laterPrev = ob.tabs4later;
    let tabs4later = {};
    const groups = Object.keys(tabs4laterPrev);
    // console.log(groups);
    groups.forEach(key => {
      if (key !== group) {
        tabs4later[key] = tabs4laterPrev[key];
      }
    });
    // console.log(tabs4later);
    chrome.storage.sync.set({tabs4later}, window.location.reload());
  });
};

const updateOpenTabs = () => {
  chrome.tabs.onUpdated.addListener((tabId , info) => {
    // console.log(info);
    if (info.status === "complete") {
      // console.log('updated tabs');
      loadOpenTabs();
      loadSavedTabs();
    }
  });
  chrome.tabs.onRemoved.addListener(() => {
    loadOpenTabs();
    loadSavedTabs();
  });
  // chrome.tabs.onActivated.addListener((info) => {
  //   console.log(info);
  // });
};

const createNewGroup = () => {
  // console.log('create new group button clicked');
  chrome.storage.sync.get(ob => {
    // console.log(ob);
    // console.log(Object.keys(ob.tabs4later));
    let groups = Object.keys(ob.tabs4later);
    groups = groups.sort((a,b) => {
      return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
    });
    // console.log(groups);
    // let groupString = Object.keys(ob.tabs4later)[Object.keys(ob.tabs4later).length-1];
    let groupString = groups[groups.length-1];
    // console.log(groupString);
    let numGroups = parseInt(groupString.match(/\d+/)[0]) + 1;
    // console.log(numGroups);
    $(`<div class=single-tab-group><div class=tab-group-container><button class=delete-tab-group>Delete Group</button><div class=group-name>Group${numGroups}</div><button class=clear-group-tabs>Clear Group</button></div><ul class=groupped-tabs id=group${numGroups}></ul></div>`).insertBefore('.create-new-group');
    // $('.clear-group-tabs').off();
    // $('.clear-group-tabs').on('click', removeAllSavedTabs);
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

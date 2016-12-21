
const loadGroupList = () => {
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {
    $('.groups').empty();
    let currentUrl = tabs[0].url;
    if ((currentUrl.match(/chrome.google.com\/webstore/))) {
      $('body').empty();
      $('body').append(`<p class=no-work>Pop up does not work on chrome store</p>`);
      return;
    }
    chrome.storage.sync.get(ob => {
      // need to fix group ordering
      // console.log(ob);
      // console.log(ob.tabs4later);
      // console.log(Object.keys(ob.tabs4later));
      const groups = Object.keys(ob.tabs4later);
      let groupUrls = {};
      groups.forEach(group => {
        let urls = [];
        ob.tabs4later[group].forEach(urlObj => {
          urls = urls.concat(Object.keys(urlObj)[0]);
        });
        groupUrls[group] = urls;
      });
      // console.log(groupUrls);
      // console.log(currentUrl);
      // groupUrls = groupUrls.concat(Object.keys([group])[0]);
      groups.forEach(group => {
        if (groupUrls[group].includes(currentUrl)) {
          $('.groups').append(`<li class=group-list-selected data-id=${group}>${group}</li>`);
        } else {
          $('.groups').append(`<li class=group-list data-id=${group}>${group}</li>`);
        }
      });
      $('.group-list').on('click', addCurrentPageToGroup);
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  loadGroupList();
});

const addCurrentPageToGroup = (e) => {
  // console.log(e.target.attributes[1].value);
  const groupId = e.target.attributes[1].value;
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {
    let currentUrl = tabs[0].url;
    // console.log(currentUrl);
    const title = tabs[0].title;
    const id = tabs[0].id;
    chrome.storage.sync.get(ob => {
      let group = ob.tabs4later[groupId];
      // console.log(group);
      let groupUrls = [];
      group.forEach(url => {
        groupUrls = groupUrls.concat(Object.keys(url)[0]);
      });
      // console.log(groupUrls);
      // if (!groupUrls.includes(currentUrl)) {
        // console.log('current page is not included in group');
        let updatedGroup = ob.tabs4later[groupId];
        let newUrl = {};
        newUrl[currentUrl] = {
          id: id,
          url: currentUrl,
          title: title,
          idle: 0
        };
        updatedGroup = updatedGroup.concat(newUrl);
        let tabs4later = ob.tabs4later;
        tabs4later[groupId] = updatedGroup;
        // console.log(tabs4later);
        chrome.storage.sync.set({
          tabs4later
        }, ()=>{
          loadGroupList();
        });
      // }
    });
  });
};

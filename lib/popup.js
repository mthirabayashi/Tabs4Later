

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {
    let currentUrl = tabs[0].url;
    chrome.storage.sync.get(ob => {
      console.log(ob);
      console.log(ob.tabs4later);
      console.log(Object.keys(ob.tabs4later));
      const groups = Object.keys(ob.tabs4later);
      // let groupUrls = [];
      // groupUrls = groupUrls.concat(Object.keys([group])[0]);
      groups.forEach(group => {
        $('.groups').append(`<li class=group-list data-id=${group}>${group}</li>`);
      });
      $('.group-list').on('click', addCurrentPageToGroup);
    });
  });
});

const addCurrentPageToGroup = (e) => {
  console.log(e);
  console.log(e.target.attributes[1].value);
  const groupId = e.target.attributes[1].value;
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, (tabs) => {
    let currentUrl = tabs[0].url;
    chrome.storage.sync.get(ob => {
      let group = ob.tabs4later[groupId];
      console.log(group);
      let groupUrls = [];
      group.forEach(url => {
        groupUrls = groupUrls.concat(Object.keys(url)[0]);
      });
      console.log(groupUrls);
      if (!groupUrls.includes(currentUrl)) {
        console.log('current page is not included in group');
      }
    });
  });
};

// setInterval(incrementIdleTime, 5000);
console.log('background page running!');
alert('background page executed');

const incrementIdleTime = () => {
  console.log('incrementing time');
  // chrome.tabs.query({}, (tabs) => {
  //   console.log(tabs);
  //   let openTabs = [];
    // tabs.forEach( tab => {
    //   if (tab.url === "chrome://newtab/") {
    //     return;
    //   }
    //   let openTab = {};
    //   const url = tab.url;
    //   openTab[url] = {
    //     id: tab.id,
    //     url: tab.url,
    //     title: tab.title
    //   };
    //   console.log(openTab[url]['idle']);
    //   if (openTab[url]['idle'] > 0) {
    //     openTab[url]['idle'] = openTab[url]['idle'] + 1;
    //   } else {
    //     openTab[url]['idle'] = 1;
    //   }
    //   openTabs = openTabs.concat(openTab);
    // });
    chrome.storage.sync.get(ob => {
      let tabs4later = ob;
      let openTabs = [];
      if (ob['tabs4later']) {
        tabs4later = ob.tabs4later;
        tabs4later['openTabs'] = openTabs;
      }
      chrome.storage.sync.set(
        {
          tabs4later: {
            openTabs: openTabs
          }
        }, () => {
          loadOpenTabs();
          loadSavedTabs();
          console.log('open tab times updated');
        });
    });
  // });
};

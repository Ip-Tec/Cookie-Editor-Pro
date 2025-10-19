document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const addButton = document.getElementById('add-button');
  const modal = document.getElementById('edit-modal');
  const closeButton = document.querySelector('.close-button');
  const saveButton = document.getElementById('save-button');
  const modalTitle = document.getElementById('edit-modal-title');
  const editType = document.getElementById('edit-type');
  const editOriginalName = document.getElementById('edit-original-name');
  const editName = document.getElementById('edit-name');
  const editValue = document.getElementById('edit-value');

  let currentTab = 'cookies';

  const loadData = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0].url;

      // Load Cookies
      chrome.cookies.getAll({ url: currentUrl }, (cookies) => {
        const cookiesTbody = document.querySelector('#cookies-table tbody');
        cookiesTbody.innerHTML = '';
        cookies.forEach(cookie => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="long-text">${cookie.name}</td>
            <td class="long-text">${cookie.value}</td>
            <td class="actions">
              <button class="edit-button" data-name="${cookie.name}" data-value="${cookie.value}">Edit</button>
              <button class="delete-button" data-name="${cookie.name}">Delete</button>
            </td>
          `;
          cookiesTbody.appendChild(row);
        });
      });

      // Load Local Storage
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => localStorage
      }, (result) => {
        const localStorageTbody = document.querySelector('#local-storage-table tbody');
        localStorageTbody.innerHTML = '';
        const data = result[0].result;
        for (const key in data) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="long-text">${key}</td>
            <td class="long-text">${data[key]}</td>
            <td class="actions">
              <button class="edit-button" data-name="${key}" data-value="${data[key]}">Edit</button>
              <button class="delete-button" data-name="${key}">Delete</button>
            </td>
          `;
          localStorageTbody.appendChild(row);
        }
      });

      // Load Session Storage
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => sessionStorage
      }, (result) => {
        const sessionStorageTbody = document.querySelector('#session-storage-table tbody');
        sessionStorageTbody.innerHTML = '';
        const data = result[0].result;
        for (const key in data) {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="long-text">${key}</td>
            <td class="long-text">${data[key]}</td>
            <td class="actions">
              <button class="edit-button" data-name="${key}" data-value="${data[key]}">Edit</button>
              <button class="delete-button" data-name="${key}">Delete</button>
            </td>
          `;
          sessionStorageTbody.appendChild(row);
        }
      });
    });
  };

  const switchTab = (tab) => {
    currentTab = tab;
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.add('active');
    tabContents.forEach(c => c.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  const openModal = (type, name = '', value = '') => {
    modal.style.display = 'block';
    editType.value = type;
    editOriginalName.value = name;
    editName.value = name;
    editValue.value = value;
    modalTitle.textContent = name ? `Edit ${type}` : `Add ${type}`;
  };

  const closeModal = () => {
    modal.style.display = 'none';
  };

  addButton.addEventListener('click', () => {
    openModal(currentTab.slice(0, -1));
  });

  closeButton.addEventListener('click', closeModal);

  saveButton.addEventListener('click', () => {
    const type = editType.value;
    const originalName = editOriginalName.value;
    const name = editName.value;
    const value = editValue.value;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      const url = tabs[0].url;

      if (type === 'cookie') {
        if (originalName) {
          chrome.cookies.remove({ url, name: originalName }, () => {
            chrome.cookies.set({ url, name, value }, loadData);
          });
        } else {
          chrome.cookies.set({ url, name, value }, loadData);
        }
      } else {
        chrome.scripting.executeScript({
          target: { tabId },
          function: (type, originalName, name, value) => {
            if (type === 'local-storage') {
              if (originalName && originalName !== name) {
                localStorage.removeItem(originalName);
              }
              localStorage.setItem(name, value);
            } else if (type === 'session-storage') {
              if (originalName && originalName !== name) {
                sessionStorage.removeItem(originalName);
              }
              sessionStorage.setItem(name, value);
            }
          },
          args: [type, originalName, name, value]
        }, loadData);
      }
    });

    closeModal();
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-button')) {
      const type = currentTab.slice(0, -1);
      const name = e.target.dataset.name;
      const value = e.target.dataset.value;
      openModal(type, name, value);
    }

    if (e.target.classList.contains('delete-button')) {
      const name = e.target.dataset.name;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        const url = tabs[0].url;

        if (currentTab === 'cookies') {
          chrome.cookies.remove({ url, name }, loadData);
        } else {
          chrome.scripting.executeScript({
            target: { tabId },
            function: (type, name) => {
              if (type === 'local-storage') {
                localStorage.removeItem(name);
              } else if (type === 'session-storage') {
                sessionStorage.removeItem(name);
              }
            },
            args: [currentTab, name]
          }, loadData);
        }
      });
    }
  });

  loadData();
});
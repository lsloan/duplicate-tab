const default_options = {
  background: false,
};

let all_commands = [];
chrome.commands.getAll(function(commands) {
  all_commands = commands.map((c) => c.name);
});

function refresh_shortcuts() {
  chrome.commands.getAll(function(commands) {
    commands.forEach(function(command) {
      const shortcut = document.getElementById(`${command.name}-shortcut`);
      if (!shortcut) return;
      shortcut.value = command.shortcut || "";
    });
  });
}

document.addEventListener("DOMContentLoaded", function() {
  refresh_shortcuts();

  const save = document.getElementById("save");
  save.addEventListener("click", function() {
    if (document.getElementById("duplicate-to-new-window-shortcut").value != "") {
      chrome.permissions.request({
        permissions: ["tabs"]
      }, function(granted) {
        revoke.disabled = !granted;
      });
    }
  });
  save.addEventListener("click", async function() {
    document.getElementById("error").innerText = "";
    try {
      for (let i=0; i < all_commands.length; i++) {
        const command = all_commands[i];
        const shortcut = document.getElementById(`${command}-shortcut`);
        if (!shortcut) continue;
        if (shortcut.value == "") {
          await browser.commands.reset(command);
        }
        else {
          await browser.commands.update({
            name: command,
            shortcut: shortcut.value,
          });
        }
      }
      refresh_shortcuts();
    } catch (e) {
      document.getElementById("error").innerText = e.toString();
    }
  });

  // bind enter key to save button
  chrome.commands.getAll(function(commands) {
    commands.forEach(function(command) {
      const shortcut = document.getElementById(`${command.name}-shortcut`);
      if (!shortcut) return;
      shortcut.addEventListener("keyup", function(e) {
        if (e.keyCode == 13) {
          save.click();
        }
      });
    });
  });

  const background = document.getElementById("background");
  const revoke = document.getElementById("revoke");

  chrome.storage.sync.get(default_options, function(options) {
    background.checked = options.background;

    chrome.permissions.contains({
      permissions: ["tabs"]
    }, function(result) {
      revoke.disabled = !result;
      if (!result) {
        background.checked = false;
      }
    });

    background.addEventListener("change", function() {
      if (background.checked) {
        chrome.permissions.request({
          permissions: ["tabs"]
        }, function(granted) {
          if (granted) {
            const new_options = {
              background: true,
            };
            chrome.storage.sync.set(new_options);
          }
          revoke.disabled = !granted;
          background.checked = granted;
        });
      }
      else {
        const new_options = {
          background: background.checked,
        };
        chrome.storage.sync.set(new_options);
      }
    });
  });

  revoke.addEventListener("click", function() {
    chrome.permissions.remove({
      permissions: ["tabs"]
    }, function(removed) {
      if (removed) {
        revoke.disabled = true;
        background.checked = false;
        const new_options = {
          background: background.checked,
        };
        chrome.storage.sync.set(new_options);
      }
    });
  });
});

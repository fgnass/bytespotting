const fetch = require("node-fetch");

module.exports = {
  async getValue(key) {
    const res = await fetch(
      `https://keyvalue.immanuel.co/api/KeyVal/GetValue/iwenudmj/${key}`
    );
    return await res.json();
  },

  async setValue(key, value) {
    await fetch(
      `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/iwenudmj/${key}/${value}`,
      { method: "POST" }
    );
  },
};

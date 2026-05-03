from typing import Any
import base64
import hashlib
import hmac
import json
import requests
import urllib3
import uuid


class SunsynkClient:
    def __init__(
        self,
        base_url: str,
        access_token: str,
        verify_ssl: bool = True,
        app_key: str = "",
        app_secret: str = "",
        username: str = "",
        password: str = "",
    ):
        self.oauth_base_url = (base_url or "https://openapi.sunsynk.net").rstrip("/")
        self.data_base_url = "https://pv.inteless.com"
        self.access_token = access_token
        self.verify_ssl = verify_ssl
        self.app_key = app_key
        self.app_secret = app_secret
        self.username = username
        self.password = password

        if not self.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def request_access_token(self) -> dict[str, Any]:
        url_path = "/oauth/token"
        url = f"{self.oauth_base_url}{url_path}"
        
        nonce = str(uuid.uuid4())

        body = {
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
            "client_id": "openapi",
        }

        body_json = json.dumps(body, separators=(",", ":"))

        md5_digest = hashlib.md5(body_json.encode("utf-8")).digest()
        content_md5 = base64.b64encode(md5_digest).decode("utf-8")

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "Content-MD5": content_md5,
            "X-Ca-Nonce": nonce,
            "X-Ca-Key": self.app_key,
        }

        headers_to_sign = {
            "x-ca-key": self.app_key,
            "x-ca-nonce": nonce,
        }
        sorted_header_keys = sorted(headers_to_sign.keys())
        signature_headers = ",".join(sorted_header_keys)

        text_to_sign = ""
        text_to_sign += "POST\n"
        text_to_sign += "application/json\n"
        text_to_sign += content_md5 + "\n"
        text_to_sign += "application/json\n"
        text_to_sign += "\n"

        for key in sorted_header_keys:
            text_to_sign += f"{key}:{headers_to_sign[key]}\n"

        text_to_sign += url_path

        signature_digest = hmac.new(
            self.app_secret.encode("utf-8"),
            text_to_sign.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature = base64.b64encode(signature_digest).decode("utf-8")

        headers["X-Ca-Signature"] = signature
        headers["X-Ca-Signature-Headers"] = signature_headers

        try:
            response = requests.post(
                url,
                headers=headers,
                data=body_json,
                timeout=15,
                verify=self.verify_ssl,
            )

            try:
                response_json = response.json()
            except Exception:
                response_json = None

            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "url": response.url,
                "response_json": response_json,
                "response_text": response.text[:2000],
                "debug_text_to_sign": text_to_sign,
                "debug_signature_headers": signature_headers,
            }
        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
                "url": url,
            }

    def get_inverters(self, data_token: str) -> dict[str, Any]:
        url = (
            "https://api.sunsynk.net/api/v1/inverters"
            "?page=1"
            "&limit=10"
            "&total=0"
            "&status=-1"
            "&sn="
            "&plantId="
            "&type=-2"
            "&softVer="
            "&hmiVer="
            "&agentCompanyId=-1"
            "&gsn="
        )

        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {data_token}",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": "https://api.sunsynk.net/device/inverter",
            "Origin": "https://api.sunsynk.net",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/147.0.0.0 Safari/537.36"
            ),
        }

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=15,
                verify=self.verify_ssl,
            )

            #print("inverters url =", url)
            #print("inverters status =", response.status_code)
            #print("inverters body =", response.text[:2000])
            print("polling data for inverter, status = ",response.status_code)

            try:
                response_json = response.json()
            except Exception:
                response_json = None

            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "url": response.url,
                "response_json": response_json,
                "response_text": response.text[:2000],
            }

        except Exception as ex:
            return {
                "success": False,
                "status_code": None,
                "url": url,
                "message": str(ex),
            }

    def request_powerview_token(self) -> dict[str, Any]:
        url = "https://pv.inteless.com/oauth/token"

        body = {
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
            "client_id": "csp-web",
        }

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json;charset=UTF-8",
            "Origin": "https://sunsynk.net",
            "Referer": "https://sunsynk.net/",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/99.0.4844.74 Safari/537.36"
            ),
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=body,
                timeout=15,
                verify=self.verify_ssl,
            )

            try:
                response_json = response.json()
            except Exception:
                response_json = None

            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "url": response.url,
                "response_json": response_json,
                "response_text": response.text[:2000],
            }
        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
                "url": url,
            }

    def get_inverter_detail(self, data_token: str, inverter_sn: str) -> dict[str, Any]:
        url = f"https://api.sunsynk.net/api/v1/inverter/{inverter_sn}"

        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {data_token}",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": "https://api.sunsynk.net/device/inverter",
            "Origin": "https://api.sunsynk.net",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/147.0.0.0 Safari/537.36"
            ),
        }

        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=15,
                verify=self.verify_ssl,
            )

            print("detail url =", url)
            print("detail status =", response.status_code)
            print("detail body =", response.text[:2000])

            try:
                response_json = response.json()
            except Exception:
                response_json = None

            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "url": response.url,
                "response_json": response_json,
                "response_text": response.text[:2000],
            }

        except Exception as ex:
            return {
                "success": False,
                "status_code": None,
                "url": url,
                "message": str(ex),
            }
    def _auth_headers(self, token: str) -> dict:
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Referer": "https://api.sunsynk.net/device/inverter",
            "Origin": "https://api.sunsynk.net",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/147.0.0.0 Safari/537.36"
            ),
        }


    def _probe_endpoint(self, path: str, token: str) -> dict:
        url = f"https://api.sunsynk.net{path}"

        try:
            response = requests.get(
                url,
                headers=self._auth_headers(token),
                timeout=15,
                verify=self.verify_ssl,
            )

            #print("probe url =", url)
            print("probe status =", response.status_code)
            #print("body =", response.text[:1500])

            try:
                json_data = response.json()
            except Exception:
                json_data = None

            return {
                "path": path,
                "status": response.status_code,
                "json": json_data,
                "text": response.text[:1500],
            }

        except Exception as ex:
            return {
                "path": path,
                "status": "error",
                "error": str(ex),
            }


    def probe_realtime(self, token: str, sn: str) -> dict:
        candidates = [
            f"/api/v1/inverter/battery/{sn}/realtime?lan=en",
            f"/api/v1/inverter/grid/{sn}/realtime",
            f"/api/v1/inverter/input/{sn}/realtime",
            f"/api/v1/inverter/output/{sn}/realtime",
            f"/api/v1/inverter/{sn}/realtime",
            f"/api/v1/device/{sn}/realtime",
        ]

        results = []

        for path in candidates:
            results.append(self._probe_endpoint(path, token))

        return {"results": results}
    
    def get_live_summary_partial(self, token: str, sn: str) -> dict[str, Any]:
        inverter_result = self.get_inverters(token)
        infos = inverter_result.get("response_json", {}).get("data", {}).get("infos", [])

        selected = None
        for inv in infos:
            if str(inv.get("sn")) == str(sn):
                selected = inv
                break

        if not selected:
            return {"success": False, "message": "Selected inverter not found"}

        grid_result = self._probe_endpoint(
            f"/api/v1/inverter/grid/{sn}/realtime",
            token,
        )

        battery_result = self._probe_endpoint(
            f"/api/v1/inverter/battery/{sn}/realtime?lan=en",
            token,
        )

        grid_json = grid_result.get("json", {})
        battery_json = battery_result.get("json", {})

        inverter_power_w = int(selected.get("pac") or 0)
        today_kwh = float(selected.get("etoday") or 0)
        total_kwh = float(selected.get("etotal") or 0)
        last_update = selected.get("updateAt")
        plant_name = selected.get("plant", {}).get("name")

        grid_w = 0
        try:
            grid_w = int(grid_json.get("data", {}).get("vip", [{}])[0].get("power", 0))
        except Exception:
            pass

        battery_soc = 0
        battery_w = 0
        try:
            battery_data = battery_json.get("data", {})
            battery_soc = int(float(battery_data.get("soc", 0)))
            battery_w = int(float(battery_data.get("power", 0)))
        except Exception:
            pass

        # Energy balance: load = solar + grid_import - battery_charge
        # Sign conventions (matching sample_generator.py):
        #   grid_w    > 0 = importing from grid, < 0 = exporting
        #   battery_w > 0 = charging,            < 0 = discharging
        solar_w = max(inverter_power_w, 0)
        load_w = max(int(solar_w + grid_w - battery_w), 0)

        return {
            "sn": selected.get("sn"),
            "power_w": inverter_power_w,
            "today_kwh": today_kwh,
            "total_kwh": total_kwh,
            "last_update": last_update,
            "plant_name": plant_name,
            "solar_w": solar_w,
            "load_w": load_w,
            "battery_soc": battery_soc,
            "battery_w": battery_w,
            "grid_w": grid_w,
        }
    
    def refresh_access_token(self, refresh_token: str):
        url_path = "/oauth/token"

        payload = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        try:
            response = self.session.post(
                f"{self.base_url}{url_path}",
                json=payload,
                timeout=10,
            )

            json_data = response.json()

            return {
                "success": response.status_code == 200 and json_data.get("success"),
                "status_code": response.status_code,
                "response_json": json_data,
                "response_text": response.text[:1000],
            }

        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
            }
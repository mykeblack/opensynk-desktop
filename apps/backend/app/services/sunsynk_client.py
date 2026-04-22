from typing import Any

import requests
import urllib3


class SunsynkClient:
    def __init__(self, base_url: str, access_token: str, verify_ssl: bool = True):
        self.base_url = base_url.rstrip("/")
        self.access_token = access_token
        self.verify_ssl = verify_ssl

        if not self.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    def test_connection(self) -> dict[str, Any]:
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/sites",
                headers=self._headers(),
                timeout=10,
                verify=self.verify_ssl,
            )

            if response.status_code != 200:
                return {
                    "success": False,
                    "message": f"API returned status {response.status_code}",
                }

            data = response.json()

            return {
                "success": True,
                "message": "Connection successful",
                "site_count": len(data) if isinstance(data, list) else 0,
            }
        except Exception as ex:
            return {
                "success": False,
                "message": str(ex),
            }

    def get_sites(self) -> list[dict[str, Any]]:
        response = requests.get(
            f"{self.base_url}/api/v1/sites",
            headers=self._headers(),
            timeout=10,
            verify=self.verify_ssl,
        )

        response.raise_for_status()

        data = response.json()
        return data if isinstance(data, list) else []
#include <iostream>
#include <vector>

using namespace std;

class Solution {
public:
	vector<int> solve(vector<int> &nums, int &target) {
		vector<int> ans;	
	    for (int i = 0; i < nums.size(); i++) {
	        for (int j = i+1; j < nums.size(); j++) {
	            if (nums[i]+nums[j] == target) {
	                ans.push_back(i);
	                ans.push_back(j);
	                break;
	            }
	        }
	    }
	    return ans;
	}
};

int main() {
	ios_base::sync_with_stdio(0);
	cin.tie(0);

	int t = 1;
	cin >> t;

	while (t--) {
		int n, target;
		cin >> n >> target;

		vector<int> nums(n);
		for (int &x: nums) {
			cin >> x;
		}

		Solution solution = Solution();

		vector<int> ans = solution.solve(nums, target);
		for (int ele: ans) {
			cout << ele << " ";
		}
		cout << "\n";
	}
	return 0;
}